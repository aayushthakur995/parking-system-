// server.ts
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  cancelBookingById,
  createBookingForSlot,
  getAllBookings,
  getAllSlots,
} from './src/db/parkingRepo.ts';
import { runCppEngine } from './src/lib/cppBridge.ts';
import { type AuthRequest, requireAuth } from './src/middleware/auth.ts';

interface CppRankedSlot {
  slotId: string;
  slotType: string;
  status: string;
  distance: number;
  price: number;
  normDistance: number;
  normPrice: number;
  score: number;
  route: string[];
}

interface CppRecommendResponse {
  algorithm: string;
  distanceWeight: number;
  priceWeight: number;
  rankedSlots: CppRankedSlot[];
}

interface CppDijkstraResponse {
  algorithm: string;
  reachable: boolean;
  source: string;
  destination: string;
  shortestDistance: number;
  path: string[];
  exploredNodes: string[];
  exploredCount: number;
}

const VALID_NODE_PATTERN = /^(ENTRANCE|[ABC][1-5]|P(0[1-9]|1[0-9]|2[0-5]))$/;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', engine: 'C++17' });
  });

  // Get all 25 parking slots enriched with C++17 Dijkstra shortest distance & route from ENTRANCE
  app.get('/api/slots', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const slots = await getAllSlots();
      const stdinLines = ['1.0 0.0'];
      for (const s of slots) {
        stdinLines.push(`${s.slotId}|${s.graphNodeId}|${s.price}|${s.slotType}|${s.status}`);
      }

      const cppResult = await runCppEngine<CppRecommendResponse>(
        ['--mode=recommend'],
        stdinLines.join('\n') + '\n'
      );

      const routeBySlot = new Map<string, { distance: number; route: string[] }>();
      for (const item of cppResult.rankedSlots) {
        routeBySlot.set(item.slotId, { distance: item.distance, route: item.route });
      }

      const enriched = slots.map((s) => {
        const info = routeBySlot.get(s.slotId);
        return {
          ...s,
          distanceFromEntrance: info?.distance ?? 0,
          routeFromEntrance: info?.route ?? ['ENTRANCE', s.graphNodeId],
        };
      });

      res.json({ slots: enriched });
    } catch (error: any) {
      console.error('GET /api/slots error:', error);
      res.status(500).json({ error: error?.message || 'Failed to load parking slots.' });
    }
  });

  // Get all bookings
  app.get('/api/bookings', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const bookingList = await getAllBookings();
      res.json({ bookings: bookingList });
    } catch (error: any) {
      console.error('GET /api/bookings error:', error);
      res.status(500).json({ error: error?.message || 'Failed to load bookings.' });
    }
  });

  // Create a new booking and update slot status to Reserved
  app.post('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { vehicleNumber, vehicleType, slotId } = req.body ?? {};
      if (!vehicleNumber || typeof vehicleNumber !== 'string' || vehicleNumber.trim().length < 3) {
        return res.status(400).json({ error: 'Please enter a valid vehicle registration number.' });
      }
      if (!vehicleType || typeof vehicleType !== 'string') {
        return res.status(400).json({ error: 'Please select a vehicle type.' });
      }
      if (!slotId || typeof slotId !== 'string') {
        return res.status(400).json({ error: 'Please select a parking slot.' });
      }

      const created = await createBookingForSlot({
        userUid: req.user!.uid,
        vehicleNumber: vehicleNumber.trim(),
        vehicleType: vehicleType.trim(),
        slotId: slotId.trim(),
      });

      res.status(201).json({ booking: created });
    } catch (error: any) {
      console.error('POST /api/bookings error:', error);
      const msg = error?.message || 'Failed to create booking.';
      const status =
        msg.includes('not exist') || msg.includes('cannot be booked') || msg.includes('not compatible')
          ? 400
          : 500;
      res.status(status).json({ error: msg });
    }
  });

  // Cancel booking and restore slot status to Available
  app.post('/api/bookings/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
    try {
      const bookingId = Number(req.params.id);
      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return res.status(400).json({ error: 'Invalid booking ID.' });
      }

      const updated = await cancelBookingById(bookingId);
      res.json({ booking: updated });
    } catch (error: any) {
      console.error('POST /api/bookings/:id/cancel error:', error);
      const msg = error?.message || 'Failed to cancel booking.';
      const status = msg.includes('not found') || msg.includes('already cancelled') ? 400 : 500;
      res.status(status).json({ error: msg });
    }
  });

  // Main Feature: Find Parking (Availability + Vehicle Compatibility + C++17 Dijkstra + Greedy Weighted Ranking)
  app.post('/api/recommend', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { vehicleType, distanceWeight } = req.body ?? {};
      if (!vehicleType || typeof vehicleType !== 'string') {
        return res.status(400).json({ error: 'Vehicle type is required.' });
      }

      let dw = typeof distanceWeight === 'number' ? distanceWeight : 0.6;
      dw = Math.max(0, Math.min(1, dw));
      const pw = Number((1 - dw).toFixed(4));

      const allSlots = await getAllSlots();
      const availableSlots = allSlots.filter((s) => s.status === 'Available');
      const compatibleSlots = availableSlots.filter((s) =>
        s.vehicleCompatibility
          .split(',')
          .map((t) => t.trim())
          .includes(vehicleType)
      );

      if (compatibleSlots.length === 0) {
        return res.json({
          algorithm: 'Dijkstra + Greedy Weighted Ranking (C++17)',
          totalSlots: allSlots.length,
          availableCount: availableSlots.length,
          compatibleCount: 0,
          distanceWeight: dw,
          priceWeight: pw,
          recommended: null,
          rankedSlots: [],
        });
      }

      const stdinLines = [`${dw} ${pw}`];
      for (const s of compatibleSlots) {
        stdinLines.push(`${s.slotId}|${s.graphNodeId}|${s.price}|${s.slotType}|${s.status}`);
      }

      const cppResult = await runCppEngine<CppRecommendResponse>(
        ['--mode=recommend'],
        stdinLines.join('\n') + '\n'
      );

      res.json({
        ...cppResult,
        totalSlots: allSlots.length,
        availableCount: availableSlots.length,
        compatibleCount: compatibleSlots.length,
        recommended: cppResult.rankedSlots[0] ?? null,
      });
    } catch (error: any) {
      console.error('POST /api/recommend error:', error);
      res.status(500).json({ error: error?.message || 'Recommendation engine failed.' });
    }
  });

  // Algorithm Lab: Graph Topology
  app.get('/api/lab/graph', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const graphData = await runCppEngine(['--mode=graph']);
      res.json(graphData);
    } catch (error: any) {
      console.error('GET /api/lab/graph error:', error);
      res.status(500).json({ error: error?.message || 'Failed to load graph from C++17 engine.' });
    }
  });

  // Algorithm Lab: Dijkstra Shortest Path
  app.post('/api/lab/dijkstra', requireAuth, async (req: AuthRequest, res) => {
    try {
      const source = typeof req.body?.source === 'string' ? req.body.source.trim() : 'ENTRANCE';
      const destination = typeof req.body?.destination === 'string' ? req.body.destination.trim() : 'P01';

      if (!VALID_NODE_PATTERN.test(source) || !VALID_NODE_PATTERN.test(destination)) {
        return res.status(400).json({ error: 'Invalid graph node identifier.' });
      }

      const result = await runCppEngine<CppDijkstraResponse>([
        '--mode=dijkstra',
        `--src=${source}`,
        `--dst=${destination}`,
      ]);
      res.json(result);
    } catch (error: any) {
      console.error('POST /api/lab/dijkstra error:', error);
      res.status(500).json({ error: error?.message || 'Dijkstra execution failed.' });
    }
  });

  // Algorithm Lab: Greedy Weighted Slot Ranking
  app.post('/api/lab/greedy', requireAuth, async (req: AuthRequest, res) => {
    try {
      let dw = typeof req.body?.distanceWeight === 'number' ? req.body.distanceWeight : 0.5;
      dw = Math.max(0, Math.min(1, dw));
      const pw = Number((1 - dw).toFixed(4));
      const onlyAvailable = req.body?.onlyAvailable !== false;

      const allSlots = await getAllSlots();
      const candidates = onlyAvailable
        ? allSlots.filter((s) => s.status === 'Available')
        : allSlots;

      const stdinLines = [`${dw} ${pw}`];
      for (const s of candidates) {
        stdinLines.push(`${s.slotId}|${s.graphNodeId}|${s.price}|${s.slotType}|${s.status}`);
      }

      const cppResult = await runCppEngine<CppRecommendResponse>(
        ['--mode=recommend'],
        stdinLines.join('\n') + '\n'
      );
      res.json(cppResult);
    } catch (error: any) {
      console.error('POST /api/lab/greedy error:', error);
      res.status(500).json({ error: error?.message || 'Greedy ranking execution failed.' });
    }
  });

  // Algorithm Lab: Travelling Salesman Problem (Brute Force)
  app.post('/api/lab/tsp', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rawCheckpoints = Array.isArray(req.body?.checkpoints) ? req.body.checkpoints : [];
      const checkpoints = Array.from(
        new Set(
          rawCheckpoints
            .filter((c: unknown): c is string => typeof c === 'string')
            .map((c: string) => c.trim())
            .filter((c: string) => VALID_NODE_PATTERN.test(c) && c !== 'ENTRANCE')
        )
      );

      if (checkpoints.length < 2 || checkpoints.length > 8) {
        return res.status(400).json({
          error: 'Please select between 2 and 8 checkpoints for TSP evaluation.',
        });
      }

      const result = await runCppEngine([
        '--mode=tsp',
        '--start=ENTRANCE',
        `--checkpoints=${checkpoints.join(',')}`,
      ]);
      res.json(result);
    } catch (error: any) {
      console.error('POST /api/lab/tsp error:', error);
      res.status(500).json({ error: error?.message || 'TSP execution failed.' });
    }
  });

  // Algorithm Lab: Branch & Bound vs Brute Force TSP Comparison
  app.post('/api/lab/branch-bound', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rawCheckpoints = Array.isArray(req.body?.checkpoints) ? req.body.checkpoints : [];
      const checkpoints = Array.from(
        new Set(
          rawCheckpoints
            .filter((c: unknown): c is string => typeof c === 'string')
            .map((c: string) => c.trim())
            .filter((c: string) => VALID_NODE_PATTERN.test(c) && c !== 'ENTRANCE')
        )
      );

      if (checkpoints.length < 2 || checkpoints.length > 8) {
        return res.status(400).json({
          error: 'Please select between 2 and 8 checkpoints for Branch & Bound comparison.',
        });
      }

      const result = await runCppEngine([
        '--mode=branch_bound',
        '--start=ENTRANCE',
        `--checkpoints=${checkpoints.join(',')}`,
      ]);
      res.json(result);
    } catch (error: any) {
      console.error('POST /api/lab/branch-bound error:', error);
      res.status(500).json({ error: error?.message || 'Branch and Bound execution failed.' });
    }
  });

  // Vite dev middleware or production static build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Park Smart server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Park Smart server:', err);
  process.exit(1);
});
