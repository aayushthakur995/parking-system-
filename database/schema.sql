-- Park Smart: PostgreSQL Reference Schema & Sample Data (pgAdmin compatible)
-- Matches Drizzle ORM definitions in src/db/schema.ts

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parking_slots (
  id SERIAL PRIMARY KEY,
  slot_id TEXT NOT NULL UNIQUE,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('Compact', 'Standard', 'Large', 'EV')),
  status TEXT NOT NULL CHECK (status IN ('Available', 'Occupied', 'Reserved')),
  price INTEGER NOT NULL CHECK (price > 0),
  vehicle_compatibility TEXT NOT NULL,
  graph_node_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  user_uid TEXT REFERENCES users(uid),
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  slot_id TEXT NOT NULL REFERENCES parking_slots(slot_id),
  booking_time TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('Active', 'Reserved', 'Completed', 'Cancelled'))
);

-- Seed 25 realistic parking slots (5x5 parking layout: P01 to P25)
INSERT INTO parking_slots (slot_id, row_index, col_index, slot_type, status, price, vehicle_compatibility, graph_node_id)
VALUES
  ('P01', 0, 0, 'Compact',  'Available', 70, 'Two-Wheeler,Hatchback',       'P01'),
  ('P02', 0, 1, 'Standard', 'Occupied',  65, 'Two-Wheeler,Hatchback,Sedan', 'P02'),
  ('P03', 0, 2, 'EV',       'Available', 90, 'EV,Hatchback,Sedan',          'P03'),
  ('P04', 0, 3, 'Standard', 'Reserved',  55, 'Two-Wheeler,Hatchback,Sedan', 'P04'),
  ('P05', 0, 4, 'Large',    'Available', 80, 'Hatchback,Sedan,SUV',         'P05'),

  ('P06', 1, 0, 'Compact',  'Occupied',  65, 'Two-Wheeler,Hatchback',       'P06'),
  ('P07', 1, 1, 'Standard', 'Available', 60, 'Two-Wheeler,Hatchback,Sedan', 'P07'),
  ('P08', 1, 2, 'Standard', 'Available', 55, 'Two-Wheeler,Hatchback,Sedan', 'P08'),
  ('P09', 1, 3, 'Large',    'Occupied',  75, 'Hatchback,Sedan,SUV',         'P09'),
  ('P10', 1, 4, 'EV',       'Available', 85, 'EV,Hatchback,Sedan,SUV',      'P10'),

  ('P11', 2, 0, 'Standard', 'Available', 55, 'Two-Wheeler,Hatchback,Sedan', 'P11'),
  ('P12', 2, 1, 'Standard', 'Reserved',  50, 'Two-Wheeler,Hatchback,Sedan', 'P12'),
  ('P13', 2, 2, 'Large',    'Available', 65, 'Hatchback,Sedan,SUV',         'P13'),
  ('P14', 2, 3, 'Compact',  'Available', 40, 'Two-Wheeler,Hatchback',       'P14'),
  ('P15', 2, 4, 'Large',    'Occupied',  60, 'Hatchback,Sedan,SUV',         'P15'),

  ('P16', 3, 0, 'Compact',  'Occupied',  50, 'Two-Wheeler,Hatchback',       'P16'),
  ('P17', 3, 1, 'Standard', 'Available', 45, 'Two-Wheeler,Hatchback,Sedan', 'P17'),
  ('P18', 3, 2, 'EV',       'Available', 75, 'EV,Hatchback,Sedan',          'P18'),
  ('P19', 3, 3, 'Standard', 'Reserved',  40, 'Two-Wheeler,Hatchback,Sedan', 'P19'),
  ('P20', 3, 4, 'Large',    'Available', 55, 'Hatchback,Sedan,SUV',         'P20'),

  ('P21', 4, 0, 'Compact',  'Available', 35, 'Two-Wheeler,Hatchback',       'P21'),
  ('P22', 4, 1, 'Standard', 'Available', 35, 'Two-Wheeler,Hatchback,Sedan', 'P22'),
  ('P23', 4, 2, 'Standard', 'Occupied',  30, 'Two-Wheeler,Hatchback,Sedan', 'P23'),
  ('P24', 4, 3, 'Large',    'Available', 45, 'Hatchback,Sedan,SUV',         'P24'),
  ('P25', 4, 4, 'Large',    'Available', 40, 'Hatchback,Sedan,SUV,EV',      'P25')
ON CONFLICT (slot_id) DO NOTHING;

-- Sample Bookings
INSERT INTO bookings (booking_code, user_uid, vehicle_number, vehicle_type, slot_id, status)
VALUES
  ('BK-1001', NULL, 'MH12AB4521', 'Hatchback',   'P02', 'Active'),
  ('BK-1002', NULL, 'MH14CD8890', 'Sedan',       'P04', 'Reserved'),
  ('BK-1003', NULL, 'KA01EF2214', 'SUV',         'P09', 'Active'),
  ('BK-1004', NULL, 'DL03GH7741', 'Sedan',       'P12', 'Reserved'),
  ('BK-1005', NULL, 'MH12XY9012', 'Two-Wheeler', 'P06', 'Active'),
  ('BK-1006', NULL, 'TN09JK3345', 'Sedan',       'P19', 'Reserved')
ON CONFLICT (booking_code) DO NOTHING;
