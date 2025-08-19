-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE alert_type AS ENUM ('Trail', 'LEO', 'Citation');
CREATE TYPE alert_status AS ENUM ('Active', 'Resolved');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create alerts table
CREATE TABLE alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type alert_type NOT NULL,
  status alert_status DEFAULT 'Active',
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photos TEXT[], -- Array of photo URLs
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  citation_date DATE, -- Only for Citation alerts
  citation_time TIME, -- Only for Citation alerts  
  agency TEXT, -- Only for Citation alerts
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  ),
  CONSTRAINT marin_county_bounds CHECK (
    latitude >= 37.85 AND latitude <= 38.35 AND
    longitude >= -122.95 AND longitude <= -122.35
  ),
  CONSTRAINT citation_fields CHECK (
    type != 'Citation' OR (
      citation_date IS NOT NULL AND 
      agency IS NOT NULL
    )
  ),
  CONSTRAINT resolved_fields CHECK (
    status != 'Resolved' OR (
      resolved_at IS NOT NULL AND 
      resolved_by IS NOT NULL
    )
  )
);

-- Create indexes for better performance
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_location ON alerts(latitude, longitude);
CREATE INDEX idx_alerts_reported_at ON alerts(reported_at DESC);
CREATE INDEX idx_alerts_reported_by ON alerts(reported_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at 
  BEFORE UPDATE ON alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Alerts policies  
CREATE POLICY "Anyone can view alerts" ON alerts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create alerts" ON alerts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE USING (auth.uid() = reported_by);

CREATE POLICY "Users can resolve any trail alert" ON alerts
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    type = 'Trail' AND 
    status = 'Active'
  );

-- Function to handle user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();