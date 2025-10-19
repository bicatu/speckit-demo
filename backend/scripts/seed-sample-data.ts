import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'movietrack_db',
  user: process.env.DB_USER || 'movietrack',
  password: process.env.DB_PASSWORD || 'movietrack_dev_password',
});

async function seedData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🧹 Cleaning up duplicate test data...');
    
    // Delete all test entries (there are none, but just in case)
    await client.query('DELETE FROM entries');
    
    // Delete duplicate platforms (keep only the original ones)
    const keepPlatforms = [
      'Amazon Prime Video',
      'Apple TV+',
      'HBO Max',
      'Hulu',
      'Netflix'
    ];
    
    await client.query(
      `DELETE FROM streaming_platforms 
       WHERE name NOT IN (${keepPlatforms.map((_, i) => `$${i + 1}`).join(', ')})`,
      keepPlatforms
    );
    
    // Delete duplicate tags (keep only the original ones)
    const keepTags = [
      'Documentary',
      'Fantasy',
      'Horror',
      'Romance',
      'Science Fiction',
      'Sci-Fi'
    ];
    
    await client.query(
      `DELETE FROM genre_tags 
       WHERE name NOT IN (${keepTags.map((_, i) => `$${i + 1}`).join(', ')})`,
      keepTags
    );
    
    console.log('✅ Cleanup complete!');
    console.log('');
    console.log('📝 Adding sample movie/series entries...');
    
    // Get platform IDs
    const platformResult = await client.query(
      'SELECT id, name FROM streaming_platforms ORDER BY name'
    );
    const platforms = platformResult.rows;
    
    // Get tag IDs
    const tagResult = await client.query(
      'SELECT id, name FROM genre_tags ORDER BY name'
    );
    const tags = tagResult.rows;
    
    // Helper to find platform by name
    const getPlatformId = (name: string) => 
      platforms.find(p => p.name === name)?.id;
    
    // Helper to find tag by name
    const getTagId = (name: string) => 
      tags.find(t => t.name === name)?.id;
    
    // Create a default user (in a real app, this would come from authentication)
    const userResult = await client.query(
      `INSERT INTO users (id, oauth_subject, email, name, created_at)
       VALUES (gen_random_uuid(), 'demo-user', 'demo@example.com', 'Demo User', NOW())
       ON CONFLICT (oauth_subject) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`
    );
    const userId = userResult.rows[0].id;
    
    // Sample movies and series
    const sampleEntries = [
      {
        title: 'The Shawshank Redemption',
        type: 'film',
        platform: 'Netflix',
        tags: ['Romance']
      },
      {
        title: 'Breaking Bad',
        type: 'series',
        platform: 'Netflix',
        tags: ['Romance']
      },
      {
        title: 'Inception',
        type: 'film',
        platform: 'HBO Max',
        tags: ['Sci-Fi']
      },
      {
        title: 'Stranger Things',
        type: 'series',
        platform: 'Netflix',
        tags: ['Horror', 'Sci-Fi']
      },
      {
        title: 'The Office',
        type: 'series',
        platform: 'Netflix',
        tags: ['Romance']
      },
      {
        title: 'The Godfather',
        type: 'film',
        platform: 'Amazon Prime Video',
        tags: ['Romance']
      },
      {
        title: 'Game of Thrones',
        type: 'series',
        platform: 'HBO Max',
        tags: ['Fantasy']
      },
      {
        title: 'Interstellar',
        type: 'film',
        platform: 'Amazon Prime Video',
        tags: ['Sci-Fi']
      },
      {
        title: 'The Crown',
        type: 'series',
        platform: 'Netflix',
        tags: ['Documentary']
      },
      {
        title: 'Pulp Fiction',
        type: 'film',
        platform: 'Netflix',
        tags: ['Romance']
      },
      {
        title: 'The Mandalorian',
        type: 'series',
        platform: 'Apple TV+',
        tags: ['Sci-Fi', 'Fantasy']
      },
      {
        title: 'Parasite',
        type: 'film',
        platform: 'Hulu',
        tags: ['Horror']
      }
    ];
    
    // Insert entries
    for (const entry of sampleEntries) {
      const platformId = getPlatformId(entry.platform);
      
      if (!platformId) {
        console.log(`⚠️  Skipping ${entry.title} - platform not found: ${entry.platform}`);
        continue;
      }
      
      // Insert entry
      const entryResult = await client.query(
        `INSERT INTO entries 
         (id, creator_id, title, media_type, platform_id, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [userId, entry.title, entry.type, platformId]
      );
      
      const entryId = entryResult.rows[0].id;
      
      // Associate tags
      for (const tagName of entry.tags) {
        const tagId = getTagId(tagName);
        if (tagId) {
          await client.query(
            `INSERT INTO entry_tags (entry_id, tag_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [entryId, tagId]
          );
        }
      }
      
      console.log(`  ✓ Added: ${entry.title}`);
    }
    
    await client.query('COMMIT');
    
    console.log('');
    console.log('✅ Sample data seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    
    const entriesCount = await client.query('SELECT COUNT(*) FROM entries');
    const platformsCount = await client.query('SELECT COUNT(*) FROM streaming_platforms');
    const tagsCount = await client.query('SELECT COUNT(*) FROM genre_tags');
    
    console.log(`  - Entries: ${entriesCount.rows[0].count}`);
    console.log(`  - Platforms: ${platformsCount.rows[0].count}`);
    console.log(`  - Tags: ${tagsCount.rows[0].count}`);
    console.log('');
    console.log('🚀 You can now browse entries at http://localhost:5173/entries');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedData().catch(console.error);
