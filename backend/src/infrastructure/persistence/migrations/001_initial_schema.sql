-- Initial database schema for Multi-User Movie & Series Tracking Application
-- Creates all tables with constraints and indexes

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  oauth_subject VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_oauth_subject ON users(oauth_subject);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Streaming platforms table
CREATE TABLE IF NOT EXISTS streaming_platforms (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Genre tags table
CREATE TABLE IF NOT EXISTS genre_tags (
  id UUID PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY,
  title VARCHAR(200) UNIQUE NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('film', 'series')),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform_id UUID REFERENCES streaming_platforms(id) ON DELETE SET NULL,
  average_rating DECIMAL(3,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_title ON entries(title);
CREATE INDEX IF NOT EXISTS idx_entries_media_type ON entries(media_type);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_creator_id ON entries(creator_id);
CREATE INDEX IF NOT EXISTS idx_entries_average_rating ON entries(average_rating DESC);

-- Entry tags junction table
CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES genre_tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_tags_tag_id ON entry_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_entry_tags_entry_id ON entry_tags(entry_id);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 10),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_entry_id ON ratings(entry_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on entries
DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on ratings
DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
