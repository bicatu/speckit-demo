-- Seed data for development environment
-- Creates initial admin user, sample platforms, and genre tags

-- Insert admin user (using mock OAuth subject for development)
INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'oauth_mock_admin_subject',
  'admin@example.com',
  'Admin User',
  true,
  NOW()
) ON CONFLICT (oauth_subject) DO NOTHING;

-- Insert regular test user
INSERT INTO users (id, oauth_subject, email, name, is_admin, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'oauth_mock_user_subject',
  'user@example.com',
  'Test User',
  false,
  NOW()
) ON CONFLICT (oauth_subject) DO NOTHING;

-- Insert streaming platforms
INSERT INTO streaming_platforms (id, name) VALUES
  ('00000000-0000-0000-0000-000000000011', 'Netflix'),
  ('00000000-0000-0000-0000-000000000012', 'Disney+'),
  ('00000000-0000-0000-0000-000000000013', 'Amazon Prime Video'),
  ('00000000-0000-0000-0000-000000000014', 'HBO Max'),
  ('00000000-0000-0000-0000-000000000015', 'Apple TV+'),
  ('00000000-0000-0000-0000-000000000016', 'Hulu')
ON CONFLICT (name) DO NOTHING;

-- Insert genre tags
INSERT INTO genre_tags (id, name) VALUES
  ('00000000-0000-0000-0000-000000000021', 'Action'),
  ('00000000-0000-0000-0000-000000000022', 'Comedy'),
  ('00000000-0000-0000-0000-000000000023', 'Drama'),
  ('00000000-0000-0000-0000-000000000024', 'Thriller'),
  ('00000000-0000-0000-0000-000000000025', 'Horror'),
  ('00000000-0000-0000-0000-000000000026', 'Romance'),
  ('00000000-0000-0000-0000-000000000027', 'Science Fiction'),
  ('00000000-0000-0000-0000-000000000028', 'Fantasy'),
  ('00000000-0000-0000-0000-000000000029', 'Documentary'),
  ('00000000-0000-0000-0000-000000000030', 'Animation')
ON CONFLICT (name) DO NOTHING;

-- Insert sample entries
INSERT INTO entries (id, title, media_type, creator_id, platform_id, created_at, updated_at) VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'The Matrix',
    'film',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Breaking Bad',
    'series',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Inception',
    'film',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000011',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  )
ON CONFLICT (title) DO NOTHING;

-- Insert entry tags (The Matrix: Action, Science Fiction, Thriller)
INSERT INTO entry_tags (entry_id, tag_id) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000027'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000024')
ON CONFLICT DO NOTHING;

-- Insert entry tags (Breaking Bad: Drama, Thriller)
INSERT INTO entry_tags (entry_id, tag_id) VALUES
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000023'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000024')
ON CONFLICT DO NOTHING;

-- Insert entry tags (Inception: Action, Science Fiction, Thriller)
INSERT INTO entry_tags (entry_id, tag_id) VALUES
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000021'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000027'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000024')
ON CONFLICT DO NOTHING;

-- Insert sample ratings
INSERT INTO ratings (user_id, entry_id, stars, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 9, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', 10, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 10, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000103', 8, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days')
ON CONFLICT DO NOTHING;

-- Update average ratings
UPDATE entries SET average_rating = (
  SELECT AVG(stars)::DECIMAL(4,2)
  FROM ratings
  WHERE ratings.entry_id = entries.id
) WHERE id IN (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103'
);
