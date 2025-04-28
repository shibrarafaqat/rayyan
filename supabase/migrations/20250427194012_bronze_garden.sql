/*
  # Initial Schema Setup

  1. Tables
    - profiles: User profiles with roles (karigar/muteer)
    - orders: Customer orders and their status
    - fitooras: Measurement sheet photos
    - payments: Payment records
    - notifications: System notifications
  
  2. Storage
    - fitooras bucket for storing measurement photos
  
  3. Security
    - Row Level Security (RLS) enabled on all tables
    - Role-based access control for muteer and karigar
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  role TEXT NOT NULL CHECK (role IN ('karigar', 'muteer')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  deposit_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'stitched', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  creator_id UUID REFERENCES profiles ON DELETE SET NULL
);

-- Create fitooras table (measurement sheets)
CREATE TABLE IF NOT EXISTS fitooras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create a storage bucket for fitooras
INSERT INTO storage.buckets (id, name, public)
VALUES ('fitooras', 'fitooras', true);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitooras ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Order policies for both roles
CREATE POLICY "All authenticated users can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Order policies for Muteer (owner)
CREATE POLICY "Muteer can insert orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'muteer'
    )
  );

CREATE POLICY "Muteer can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'muteer'
    )
  );

-- Order policies for Karigar (tailor)
CREATE POLICY "Karigar can update order status to stitched"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'karigar'
    )
  )
  WITH CHECK (
    status = 'stitched'
  );

-- Fitoora policies
CREATE POLICY "All authenticated users can view fitooras"
  ON fitooras
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Muteer can insert fitooras"
  ON fitooras
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'muteer'
    )
  );

-- Payment policies
CREATE POLICY "All authenticated users can view payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Muteer can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'muteer'
    )
  );

-- Notification policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Storage policies for fitooras
CREATE POLICY "Authenticated users can read fitooras"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'fitooras');

CREATE POLICY "Muteer can upload fitooras"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'fitooras' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'muteer'
    )
  );