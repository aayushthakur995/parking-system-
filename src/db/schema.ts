// src/db/schema.ts
import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Authenticated users linked via Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Parking slots table (25 slots mapped to parking graph nodes)
export const parkingSlots = pgTable('parking_slots', {
  id: serial('id').primaryKey(),
  slotId: text('slot_id').notNull().unique(), // e.g., P01..P25
  rowIndex: integer('row_index').notNull(),
  colIndex: integer('col_index').notNull(),
  slotType: text('slot_type').notNull(), // Compact | Standard | Large | EV
  status: text('status').notNull(), // Available | Occupied | Reserved
  price: integer('price').notNull(), // Hourly rate in INR
  vehicleCompatibility: text('vehicle_compatibility').notNull(), // Comma-separated vehicle types
  graphNodeId: text('graph_node_id').notNull(), // Corresponding node in C++ graph
});

// Bookings table tracking slot reservations and cancellations
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  userUid: text('user_uid').references(() => users.uid),
  vehicleNumber: text('vehicle_number').notNull(),
  vehicleType: text('vehicle_type').notNull(),
  slotId: text('slot_id')
    .references(() => parkingSlots.slotId)
    .notNull(),
  bookingTime: timestamp('booking_time').defaultNow().notNull(),
  status: text('status').notNull(), // Active | Completed | Cancelled
});

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const parkingSlotsRelations = relations(parkingSlots, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userUid],
    references: [users.uid],
  }),
  slot: one(parkingSlots, {
    fields: [bookings.slotId],
    references: [parkingSlots.slotId],
  }),
}));
