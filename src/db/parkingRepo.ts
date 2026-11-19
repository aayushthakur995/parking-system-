// src/db/parkingRepo.ts
import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { bookings, parkingSlots } from './schema.ts';

export interface ParkingSlotRecord {
  id: number;
  slotId: string;
  rowIndex: number;
  colIndex: number;
  slotType: string;
  status: string;
  price: number;
  vehicleCompatibility: string;
  graphNodeId: string;
}

export interface BookingRecord {
  id: number;
  bookingCode: string;
  userUid: string | null;
  vehicleNumber: string;
  vehicleType: string;
  slotId: string;
  bookingTime: Date;
  status: string;
}

const INITIAL_SLOTS = [
  { slotId: 'P01', rowIndex: 0, colIndex: 0, slotType: 'Compact', status: 'Available', price: 70, vehicleCompatibility: 'Two-Wheeler,Hatchback', graphNodeId: 'P01' },
  { slotId: 'P02', rowIndex: 0, colIndex: 1, slotType: 'Standard', status: 'Occupied', price: 65, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P02' },
  { slotId: 'P03', rowIndex: 0, colIndex: 2, slotType: 'EV', status: 'Available', price: 90, vehicleCompatibility: 'EV,Hatchback,Sedan', graphNodeId: 'P03' },
  { slotId: 'P04', rowIndex: 0, colIndex: 3, slotType: 'Standard', status: 'Reserved', price: 55, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P04' },
  { slotId: 'P05', rowIndex: 0, colIndex: 4, slotType: 'Large', status: 'Available', price: 80, vehicleCompatibility: 'Hatchback,Sedan,SUV', graphNodeId: 'P05' },

  { slotId: 'P06', rowIndex: 1, colIndex: 0, slotType: 'Compact', status: 'Occupied', price: 65, vehicleCompatibility: 'Two-Wheeler,Hatchback', graphNodeId: 'P06' },
  { slotId: 'P07', rowIndex: 1, colIndex: 1, slotType: 'Standard', status: 'Available', price: 60, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P07' },
  { slotId: 'P08', rowIndex: 1, colIndex: 2, slotType: 'Standard', status: 'Available', price: 55, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P08' },
  { slotId: 'P09', rowIndex: 1, colIndex: 3, slotType: 'Large', status: 'Occupied', price: 75, vehicleCompatibility: 'Hatchback,Sedan,SUV', graphNodeId: 'P09' },
  { slotId: 'P10', rowIndex: 1, colIndex: 4, slotType: 'EV', status: 'Available', price: 85, vehicleCompatibility: 'EV,Hatchback,Sedan,SUV', graphNodeId: 'P10' },

  { slotId: 'P11', rowIndex: 2, colIndex: 0, slotType: 'Standard', status: 'Available', price: 55, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P11' },
  { slotId: 'P12', rowIndex: 2, colIndex: 1, slotType: 'Standard', status: 'Reserved', price: 50, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P12' },
  { slotId: 'P13', rowIndex: 2, colIndex: 2, slotType: 'Large', status: 'Available', price: 65, vehicleCompatibility: 'Hatchback,Sedan,SUV', graphNodeId: 'P13' },
  { slotId: 'P14', rowIndex: 2, colIndex: 3, slotType: 'Compact', status: 'Available', price: 40, vehicleCompatibility: 'Two-Wheeler,Hatchback', graphNodeId: 'P14' },
  { slotId: 'P15', rowIndex: 2, colIndex: 4, slotType: 'Large', status: 'Occupied', price: 60, vehicleCompatibility: 'Hatchback,Sedan,SUV', graphNodeId: 'P15' },

  { slotId: 'P16', rowIndex: 3, colIndex: 0, slotType: 'Compact', status: 'Occupied', price: 50, vehicleCompatibility: 'Two-Wheeler,Hatchback', graphNodeId: 'P16' },
  { slotId: 'P17', rowIndex: 3, colIndex: 1, slotType: 'Standard', status: 'Available', price: 45, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P17' },
  { slotId: 'P18', rowIndex: 3, colIndex: 2, slotType: 'EV', status: 'Available', price: 75, vehicleCompatibility: 'EV,Hatchback,Sedan', graphNodeId: 'P18' },
  { slotId: 'P19', rowIndex: 3, colIndex: 3, slotType: 'Standard', status: 'Reserved', price: 40, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P19' },
  { slotId: 'P20', rowIndex: 3, colIndex: 4, slotType: 'Large', status: 'Available', price: 55, vehicleCompatibility: 'Hatchback,Sedan,SUV', graphNodeId: 'P20' },

  { slotId: 'P21', rowIndex: 4, colIndex: 0, slotType: 'Compact', status: 'Available', price: 35, vehicleCompatibility: 'Two-Wheeler,Hatchback', graphNodeId: 'P21' },
  { slotId: 'P22', rowIndex: 4, colIndex: 1, slotType: 'Standard', status: 'Available', price: 35, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P22' },
  { slotId: 'P23', rowIndex: 4, colIndex: 2, slotType: 'Standard', status: 'Occupied', price: 30, vehicleCompatibility: 'Two-Wheeler,Hatchback,Sedan', graphNodeId: 'P23' },
  { slotId: 'P24', rowIndex: 4, colIndex: 3, slotType: 'Large', status: 'Available', price: 45, vehicleCompatibility: 'Hatchback,Sedan,SUV', graphNodeId: 'P24' },
  { slotId: 'P25', rowIndex: 4, colIndex: 4, slotType: 'Large', status: 'Available', price: 40, vehicleCompatibility: 'Hatchback,Sedan,SUV,EV', graphNodeId: 'P25' },
];

const INITIAL_BOOKINGS = [
  { bookingCode: 'BK-1001', userUid: null, vehicleNumber: 'MH12AB4521', vehicleType: 'Hatchback', slotId: 'P02', status: 'Active' },
  { bookingCode: 'BK-1002', userUid: null, vehicleNumber: 'MH14CD8890', vehicleType: 'Sedan', slotId: 'P04', status: 'Reserved' },
  { bookingCode: 'BK-1003', userUid: null, vehicleNumber: 'KA01EF2214', vehicleType: 'SUV', slotId: 'P09', status: 'Active' },
  { bookingCode: 'BK-1004', userUid: null, vehicleNumber: 'DL03GH7741', vehicleType: 'Sedan', slotId: 'P12', status: 'Reserved' },
  { bookingCode: 'BK-1005', userUid: null, vehicleNumber: 'MH12XY9012', vehicleType: 'Two-Wheeler', slotId: 'P06', status: 'Active' },
  { bookingCode: 'BK-1006', userUid: null, vehicleNumber: 'TN09JK3345', vehicleType: 'Sedan', slotId: 'P19', status: 'Reserved' },
];

export async function ensureSeeded(): Promise<void> {
  try {
    const existing = await db.select({ slotId: parkingSlots.slotId }).from(parkingSlots).limit(1);
    if (existing.length > 0) {
      return;
    }

    await db.insert(parkingSlots).values(INITIAL_SLOTS).onConflictDoNothing();
    await db.insert(bookings).values(INITIAL_BOOKINGS).onConflictDoNothing();
  } catch (error) {
    console.error('Database seed failed:', error);
    throw new Error('Failed to initialize parking inventory.', { cause: error });
  }
}

export async function getAllSlots(): Promise<ParkingSlotRecord[]> {
  try {
    await ensureSeeded();
    const rows = await db.select().from(parkingSlots);
    return rows.sort((a, b) => a.slotId.localeCompare(b.slotId));
  } catch (error) {
    console.error('Failed to query parking_slots:', error);
    throw new Error('Database query failed while loading parking slots.', { cause: error });
  }
}

export async function getAllBookings(): Promise<BookingRecord[]> {
  try {
    await ensureSeeded();
    return await db.select().from(bookings).orderBy(desc(bookings.bookingTime), desc(bookings.id));
  } catch (error) {
    console.error('Failed to query bookings:', error);
    throw new Error('Database query failed while loading bookings.', { cause: error });
  }
}

export async function createBookingForSlot(params: {
  userUid: string;
  vehicleNumber: string;
  vehicleType: string;
  slotId: string;
}): Promise<BookingRecord> {
  try {
    await ensureSeeded();
    const slotRows = await db
      .select()
      .from(parkingSlots)
      .where(eq(parkingSlots.slotId, params.slotId))
      .limit(1);

    const slot = slotRows[0];
    if (!slot) {
      throw new Error(`Slot ${params.slotId} does not exist.`);
    }
    if (slot.status !== 'Available') {
      throw new Error(`Slot ${params.slotId} is currently ${slot.status} and cannot be booked.`);
    }

    const compatibleTypes = slot.vehicleCompatibility.split(',').map((s) => s.trim());
    if (!compatibleTypes.includes(params.vehicleType)) {
      throw new Error(
        `Vehicle type ${params.vehicleType} is not compatible with slot ${params.slotId} (${slot.slotType}).`
      );
    }

    const bookingCode = `BK-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-3)}`;

    const created = await db.transaction(async (tx) => {
      await tx
        .update(parkingSlots)
        .set({ status: 'Reserved' })
        .where(eq(parkingSlots.slotId, params.slotId));

      const inserted = await tx
        .insert(bookings)
        .values({
          bookingCode,
          userUid: params.userUid,
          vehicleNumber: params.vehicleNumber.trim().toUpperCase(),
          vehicleType: params.vehicleType,
          slotId: params.slotId,
          status: 'Reserved',
        })
        .returning();

      return inserted[0];
    });

    return created;
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    if (
      error?.message?.includes('does not exist') ||
      error?.message?.includes('cannot be booked') ||
      error?.message?.includes('not compatible')
    ) {
      throw error;
    }
    throw new Error('Database transaction failed while creating booking.', { cause: error });
  }
}

export async function cancelBookingById(bookingId: number): Promise<BookingRecord> {
  try {
    await ensureSeeded();
    const existingRows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    const existing = existingRows[0];
    if (!existing) {
      throw new Error('Booking record not found.');
    }
    if (existing.status === 'Cancelled') {
      throw new Error('Booking is already cancelled.');
    }

    const updated = await db.transaction(async (tx) => {
      const result = await tx
        .update(bookings)
        .set({ status: 'Cancelled' })
        .where(eq(bookings.id, bookingId))
        .returning();

      await tx
        .update(parkingSlots)
        .set({ status: 'Available' })
        .where(eq(parkingSlots.slotId, existing.slotId));

      return result[0];
    });

    return updated;
  } catch (error: any) {
    console.error('Failed to cancel booking:', error);
    if (
      error?.message?.includes('not found') ||
      error?.message?.includes('already cancelled')
    ) {
      throw error;
    }
    throw new Error('Database transaction failed while cancelling booking.', { cause: error });
  }
}
