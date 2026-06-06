-- MHAZ Mock Data Seed — benhaus (d34f1485-db32-49d1-9331-ecee363d45b2)
-- Plain SQL, no dollar-quoting

INSERT INTO public.leo_alerts (id, user_id, lat, long, agency, description, expires_at, created_at) VALUES
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9834, -122.5943, 'Marin County Sheriff',
   'Sheriff SUV at bottom of Repack. Still there 45 min later. Could be a stakeout, two rangers on foot spotted up top.',
   now() + interval '22 hours', now() - interval '2 hours'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9076, -122.6044, 'CA State Parks',
   'Ranger truck at Pantoll staging. Two rangers heading toward Steep Ravine connector on foot.',
   now() + interval '20 hours', now() - interval '3 hours'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9597, -122.6436, 'MMWD',
   'MMWD truck past Alpine Dam toward Bon Tempe. Officer walking the road. Definitely clocking bikes.',
   now() + interval '18 hours', now() - interval '1 hour'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9712, -122.6198, 'Marin Open Space & Parks (MCOSD)',
   'MCOSD ranger on foot at Deer Park trailhead, stopped two riders ahead of me to ask where they were going.',
   now() + interval '15 hours', now() - interval '4 hours'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 38.0178, -122.5692, 'National Park Service (NPS)',
   'NPS truck on Loma Alta near the gate. Ranger checked my bike for a permit sticker. Let me through but was thorough.',
   now() + interval '23 hours', now() - interval '30 minutes'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.8651, -122.5428, 'CA State Parks',
   'Two rangers at Tennessee Valley trailhead with a clipboard, photographing bikes in the lot.',
   now() + interval '10 hours', now() - interval '5 hours');

INSERT INTO public.trail_alerts (id, user_id, lat, long, issue_type, description, status, map_expires_at, created_at) VALUES
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9147, -122.5788, 'downed_tree',
   'Large eucalyptus across Old Railroad Grade, 0.3mi above the paved section. Squeeze around left but tight, poison oak on right.',
   'active', now() + interval '89 days', now() - interval '2 days'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9385, -122.6089, 'washout',
   'Bad erosion on Eldridge Grade past the first switchback. 6ft wide, 2ft deep. Full hike-a-bike required.',
   'active', now() + interval '88 days', now() - interval '1 day'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9881, -122.6934, 'closure',
   'Bolinas Ridge closed at north end. Fresh orange fencing and closure sign posted. No reason given.',
   'active', now() + interval '85 days', now() - interval '3 days'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9275, -122.6051, 'hazard',
   'Loose gravel dumped on Northside Trail switchbacks. Super sketchy on descent, almost went OTB on the third one.',
   'active', now() + interval '87 days', now() - interval '6 hours'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9756, -122.5728, 'maintenance',
   'Water bars blown out on lower San Anselmo fire road. Deep ruts forming. Needs MCOSD attention before next rain.',
   'active', now() + interval '80 days', now() - interval '4 days');

INSERT INTO public.citations (id, user_id, lat, long, agency, incident_date, description, created_at) VALUES
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9834, -122.5943, 'Marin County Sheriff',
   now() - interval '8 days',
   'Stopped coming off Repack. Got a 250 dollar citation for closed trail. They have been watching that spot for weeks.',
   now() - interval '8 days'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 37.9076, -122.6044, 'CA State Parks',
   now() - interval '15 days',
   'Cited at Pantoll for no helmet. 75 dollar fine. Ranger said she had to write it up.',
   now() - interval '15 days'),
  (gen_random_uuid(), 'd34f1485-db32-49d1-9331-ecee363d45b2', 38.0178, -122.5692, 'National Park Service (NPS)',
   now() - interval '22 days',
   'NPS citation for riding after sunset on Loma Alta. 180 dollar fine. Truck waiting at the bottom, three of us got hit.',
   now() - interval '22 days');

INSERT INTO public.lost_found (user_id, type, description, location_text, lat, long, created_at) VALUES
  ('d34f1485-db32-49d1-9331-ecee363d45b2', 'lost',
   'Fox Transfer dropper remote, black, 22.2mm. Lost somewhere on Repack climb. Small scratch on paddle.',
   'Repack Road / top staging', 37.9834, -122.5943, now() - interval '1 day'),
  ('d34f1485-db32-49d1-9331-ecee363d45b2', 'found',
   'Dakine hip pack, olive green, medium. Found near Alpine Dam spillway. Has tube, CO2, snacks inside. DM to claim.',
   'Alpine Dam spillway', 37.9597, -122.6436, now() - interval '2 days');
