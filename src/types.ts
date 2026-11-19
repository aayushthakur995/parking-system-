// src/types.ts

export type NavSection =
  | 'dashboard'
  | 'find-parking'
  | 'parking-layout'
  | 'algorithm-lab'
  | 'bookings';

export type VehicleType = 'Two-Wheeler' | 'Hatchback' | 'Sedan' | 'SUV' | 'EV';

export interface ParkingSlot {
  id: number;
  slotId: string;
  rowIndex: number;
  colIndex: number;
  slotType: 'Compact' | 'Standard' | 'Large' | 'EV' | string;
  status: 'Available' | 'Occupied' | 'Reserved' | string;
  price: number;
  vehicleCompatibility: string;
  graphNodeId: string;
  distanceFromEntrance: number;
  routeFromEntrance: string[];
}

export interface Booking {
  id: number;
  bookingCode: string;
  userUid: string | null;
  vehicleNumber: string;
  vehicleType: string;
  slotId: string;
  bookingTime: string;
  status: 'Active' | 'Reserved' | 'Completed' | 'Cancelled' | string;
}

export interface RankedSlot {
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

export interface RecommendResponse {
  algorithm: string;
  totalSlots: number;
  availableCount: number;
  compatibleCount: number;
  distanceWeight: number;
  priceWeight: number;
  recommended: RankedSlot | null;
  rankedSlots: RankedSlot[];
}

export interface GraphNode {
  id: string;
  label: string;
  kind: 'entrance' | 'aisle' | 'slot';
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface GraphResponse {
  nodeCount: number;
  edgeCount: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DijkstraResponse {
  algorithm: string;
  reachable: boolean;
  source: string;
  destination: string;
  shortestDistance: number;
  path: string[];
  exploredNodes: string[];
  exploredCount: number;
}

export interface TSPLeg {
  from: string;
  to: string;
  distance: number;
  path: string[];
}

export interface TSPResponse {
  algorithm: string;
  valid: boolean;
  startNode: string;
  checkpoints: string[];
  optimalRoute: string[];
  totalDistance: number;
  toursEvaluated: number;
  executionTimeUs: number;
  legs: TSPLeg[];
}

export interface BBTraceStep {
  partialRoute: string[];
  currentCost: number;
  lowerBound: number;
  bestCost: number;
  action: 'EXPLORE' | 'PRUNE' | 'BEST_UPDATED' | string;
}

export interface BranchBoundResponse {
  algorithm: string;
  valid: boolean;
  startNode: string;
  checkpoints: string[];
  optimalRoute: string[];
  totalCost: number;
  branchesExplored: number;
  branchesPruned: number;
  executionTimeUs: number;
  legs: TSPLeg[];
  traceSteps: BBTraceStep[];
}

export interface BranchBoundComparisonResponse {
  bruteForce: TSPResponse;
  branchBound: BranchBoundResponse;
}
