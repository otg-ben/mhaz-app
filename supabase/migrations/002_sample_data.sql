-- Sample data for testing (only run in development)

-- Insert sample profiles (these would normally be created via auth signup)
-- Note: In production, these would be created automatically via the trigger

-- Insert sample alerts
INSERT INTO alerts (
  type, 
  category, 
  location, 
  description, 
  latitude, 
  longitude, 
  photos,
  reported_by
) VALUES 
  (
    'Trail'::alert_type,
    'Obstruction',
    'Mount Tamalpais State Park - Rock Spring Trail',
    'Large fallen tree blocking the trail approximately 0.5 miles from the Rock Spring parking area. Trail is completely impassable.',
    37.9063,
    -122.5969,
    ARRAY['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    NULL -- Will be updated when real users are created
  ),
  (
    'Trail'::alert_type,
    'Hazard',
    'Muir Woods - Redwood Creek Trail',
    'Bridge out over Redwood Creek. Creek is running high due to recent rains. Use extreme caution or find alternate route.',
    37.8974,
    -122.5808,
    ARRAY['https://example.com/bridge_out.jpg'],
    NULL
  ),
  (
    'LEO'::alert_type,
    'Enforcement',
    'Mount Diablo State Park - Summit Trail',
    'Rangers conducting trail patrol and checking permits. Ensure you have proper day-use permits displayed.',
    37.8816,
    -121.9142,
    NULL,
    NULL
  ),
  (
    'Citation'::alert_type,
    'Traffic Violation',
    'Highway 1 - Stinson Beach Parking',
    'CHP issuing citations for illegal parking along Highway 1 near Stinson Beach trail access.',
    37.9003,
    -122.6433,
    NULL,
    NULL
  )
  ON CONFLICT DO NOTHING; -- Prevent duplicate inserts

-- Set some alerts as resolved for testing
UPDATE alerts 
SET 
  status = 'Resolved'::alert_status,
  resolved_at = NOW() - INTERVAL '2 days',
  resolved_by = reported_by
WHERE type = 'LEO'::alert_type;

-- Add some older alerts for testing date filtering
INSERT INTO alerts (
  type,
  category, 
  location,
  description,
  latitude,
  longitude,
  reported_at,
  status
) VALUES
  (
    'Trail'::alert_type,
    'Closure',
    'Point Reyes - Bear Valley Trail', 
    'Trail closed for habitat restoration. Expected to reopen in 2 weeks.',
    38.0392,
    -122.7989,
    NOW() - INTERVAL '5 days',
    'Active'::alert_status
  ),
  (
    'Citation'::alert_type,
    'Parking Violation',
    'Sausalito - Rodeo Beach Parking',
    'Park rangers issuing citations for overnight parking violations.',
    37.8324,
    -122.5258,
    NOW() - INTERVAL '1 week',
    'Active'::alert_status
  )
  ON CONFLICT DO NOTHING;