-- Seed data for MHAZ application
-- This file contains realistic test data for development

-- Clear existing data (development only)
TRUNCATE alerts, profiles CASCADE;

-- Sample profiles (in production, these come from auth.users)
-- These are just for reference - real profiles created via signup trigger

-- Sample alerts with realistic Marin County locations
INSERT INTO alerts (
  id,
  type,
  category,
  location,
  description,
  latitude,
  longitude,
  photos,
  reported_at,
  status
) VALUES 
  -- Trail Alerts
  (
    uuid_generate_v4(),
    'Trail'::alert_type,
    'Obstruction',
    'Mount Tamalpais - Steep Ravine Trail',
    'Large redwood fell across trail during last storm. Completely blocks passage about 1 mile down from Pantoll parking. Hikers turning back.',
    37.9063,
    -122.5969,
    ARRAY[
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      'https://images.unsplash.com/photo-1520637836862-4d197d17c783?w=800'
    ],
    NOW() - INTERVAL '2 hours',
    'Active'::alert_status
  ),
  (
    uuid_generate_v4(),
    'Trail'::alert_type,
    'Hazard',
    'Muir Woods - Dipsea Trail',
    'Wooden bridge over creek has loose boards. Several hikers reported feeling unstable when crossing. Use caution.',
    37.8974,
    -122.5808,
    ARRAY['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],
    NOW() - INTERVAL '6 hours',
    'Active'::alert_status
  ),
  (
    uuid_generate_v4(),
    'Trail'::alert_type,
    'Closure',
    'Point Reyes - Bear Valley Trail',
    'Trail closed for endangered species nesting. Park service expects reopening in 3-4 weeks. Signs posted at trailhead.',
    38.0392,
    -122.7989,
    NULL,
    NOW() - INTERVAL '1 day',
    'Active'::alert_status
  ),
  (
    uuid_generate_v4(),
    'Trail'::alert_type,
    'Conditions',
    'Mount Diablo - Eagle Peak Trail',
    'Trail very muddy after recent rains. Sections are slippery and boots getting stuck. Recommend waiting a few days.',
    37.8816,
    -121.9142,
    NULL,
    NOW() - INTERVAL '3 hours',
    'Active'::alert_status
  ),
  
  -- LEO Alerts
  (
    uuid_generate_v4(),
    'LEO'::alert_type,
    'Enforcement',
    'Golden Gate National Recreation Area - Marin Headlands',
    'Park rangers doing permit checks on all trails today. Make sure to have recreation.gov permits ready if required.',
    37.8324,
    -122.5258,
    NULL,
    NOW() - INTERVAL '30 minutes',
    'Active'::alert_status
  ),
  (
    uuid_generate_v4(),
    'LEO'::alert_type,
    'Safety',
    'Samuel P. Taylor State Park',
    'Search and rescue training exercise in progress. May see helicopters and emergency vehicles. Trails remain open.',
    38.0203,
    -122.7243,
    NULL,
    NOW() - INTERVAL '1 hour',
    'Active'::alert_status
  ),
  
  -- Citation Alerts
  (
    uuid_generate_v4(),
    'Citation'::alert_type,
    'Parking Violation',
    'Highway 1 - Muir Beach Overlook',
    'CHP actively ticketing cars parked on shoulder. Use designated parking areas only.',
    37.8661,
    -122.5747,
    NULL,
    NOW() - INTERVAL '45 minutes',
    'Active'::alert_status
  ),
  (
    uuid_generate_v4(),
    'Citation'::alert_type,
    'Traffic Violation',
    'Panoramic Highway - Mount Tamalpais',
    'Marin County Sheriff citing speeders on Panoramic Hwy. Heavy enforcement near Pantoll parking area.',
    37.9063,
    -122.5969,
    NULL,
    NOW() - INTERVAL '2 hours',
    'Active'::alert_status
  ),
  
  -- Some resolved alerts for testing
  (
    uuid_generate_v4(),
    'Trail'::alert_type,
    'Obstruction',
    'Tennessee Valley - Tennessee Valley Trail',
    'Fallen tree removed by park maintenance crew. Trail is clear and fully passable.',
    37.8553,
    -122.5297,
    NULL,
    NOW() - INTERVAL '3 days',
    'Resolved'::alert_status
  ),
  (
    uuid_generate_v4(),
    'LEO'::alert_type,
    'Enforcement',
    'China Camp State Park',
    'Permit enforcement completed. Normal park operations resumed.',
    38.0003,
    -122.4903,
    NULL,
    NOW() - INTERVAL '2 days',
    'Resolved'::alert_status
  );