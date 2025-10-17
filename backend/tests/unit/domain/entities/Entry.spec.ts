import { Entry } from '../../../../src/domain/entities/Entry';
import { v4 as uuidv4 } from 'uuid';

describe('Entry Entity', () => {
  describe('Constructor and Basic Properties', () => {
    it('should create a film entry with valid data', () => {
      const id = uuidv4();
      const creatorId = uuidv4();
      const platformId = uuidv4();
      const now = new Date();

      const entry = new Entry({
        id,
        title: 'The Matrix',
        mediaType: 'film',
        creatorId,
        platformId,
        averageRating: null,
        createdAt: now,
        updatedAt: now,
      });

      expect(entry.id).toBe(id);
      expect(entry.title).toBe('The Matrix');
      expect(entry.mediaType).toBe('film');
      expect(entry.creatorId).toBe(creatorId);
      expect(entry.platformId).toBe(platformId);
      expect(entry.averageRating).toBeNull();
      expect(entry.createdAt).toBe(now);
      expect(entry.updatedAt).toBe(now);
    });

    it('should create a series entry with valid data', () => {
      const id = uuidv4();
      const creatorId = uuidv4();

      const entry = new Entry({
        id,
        title: 'Breaking Bad',
        mediaType: 'series',
        creatorId,
        platformId: null,
        averageRating: 9.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(entry.mediaType).toBe('series');
      expect(entry.platformId).toBeNull();
      expect(entry.averageRating).toBe(9.5);
    });
  });

  describe('Validation', () => {
    it('should throw error if title is empty', () => {
      expect(() => {
        new Entry({
          id: uuidv4(),
          title: '',
          mediaType: 'film',
          creatorId: uuidv4(),
          platformId: null,
          averageRating: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Title cannot be empty');
    });

    it('should throw error if title exceeds 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => {
        new Entry({
          id: uuidv4(),
          title: longTitle,
          mediaType: 'film',
          creatorId: uuidv4(),
          platformId: null,
          averageRating: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Title cannot exceed 200 characters');
    });

    it('should throw error if mediaType is invalid', () => {
      expect(() => {
        new Entry({
          id: uuidv4(),
          title: 'Test Movie',
          mediaType: 'book' as any,
          creatorId: uuidv4(),
          platformId: null,
          averageRating: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Media type must be either "film" or "series"');
    });

    it('should throw error if averageRating is less than 1', () => {
      expect(() => {
        new Entry({
          id: uuidv4(),
          title: 'Test Movie',
          mediaType: 'film',
          creatorId: uuidv4(),
          platformId: null,
          averageRating: 0.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Average rating must be between 1 and 10');
    });

    it('should throw error if averageRating is greater than 10', () => {
      expect(() => {
        new Entry({
          id: uuidv4(),
          title: 'Test Movie',
          mediaType: 'film',
          creatorId: uuidv4(),
          platformId: null,
          averageRating: 10.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }).toThrow('Average rating must be between 1 and 10');
    });
  });

  describe('Business Methods', () => {
    it('should update title', () => {
      const entry = new Entry({
        id: uuidv4(),
        title: 'Original Title',
        mediaType: 'film',
        creatorId: uuidv4(),
        platformId: null,
        averageRating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const originalUpdatedAt = entry.updatedAt;
      
      // Wait a tiny bit to ensure timestamp difference
      setTimeout(() => {
        entry.updateTitle('New Title');
        expect(entry.title).toBe('New Title');
        expect(entry.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should update platform', () => {
      const entry = new Entry({
        id: uuidv4(),
        title: 'Test Movie',
        mediaType: 'film',
        creatorId: uuidv4(),
        platformId: null,
        averageRating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newPlatformId = uuidv4();
      entry.updatePlatform(newPlatformId);
      expect(entry.platformId).toBe(newPlatformId);
    });

    it('should update average rating', () => {
      const entry = new Entry({
        id: uuidv4(),
        title: 'Test Movie',
        mediaType: 'film',
        creatorId: uuidv4(),
        platformId: null,
        averageRating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      entry.updateAverageRating(8.5);
      expect(entry.averageRating).toBe(8.5);
    });

    it('should validate when updating title', () => {
      const entry = new Entry({
        id: uuidv4(),
        title: 'Original Title',
        mediaType: 'film',
        creatorId: uuidv4(),
        platformId: null,
        averageRating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => entry.updateTitle('')).toThrow('Title cannot be empty');
      expect(() => entry.updateTitle('a'.repeat(201))).toThrow('Title cannot exceed 200 characters');
    });

    it('should validate when updating average rating', () => {
      const entry = new Entry({
        id: uuidv4(),
        title: 'Test Movie',
        mediaType: 'film',
        creatorId: uuidv4(),
        platformId: null,
        averageRating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => entry.updateAverageRating(0.5)).toThrow('Average rating must be between 1 and 10');
      expect(() => entry.updateAverageRating(11)).toThrow('Average rating must be between 1 and 10');
    });
  });
});
