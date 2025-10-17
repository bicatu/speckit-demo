import { GenreTag } from '../../../../src/domain/entities/GenreTag';
import { v4 as uuidv4 } from 'uuid';

describe('GenreTag Entity', () => {
  describe('Constructor and Basic Properties', () => {
    it('should create a genre tag with valid data', () => {
      const id = uuidv4();
      const tag = new GenreTag({
        id,
        name: 'Action',
      });

      expect(tag.id).toBe(id);
      expect(tag.name).toBe('Action');
    });

    it('should create multiple different genre tags', () => {
      const tags = [
        new GenreTag({ id: uuidv4(), name: 'Comedy' }),
        new GenreTag({ id: uuidv4(), name: 'Drama' }),
        new GenreTag({ id: uuidv4(), name: 'Science Fiction' }),
      ];

      expect(tags[0].name).toBe('Comedy');
      expect(tags[1].name).toBe('Drama');
      expect(tags[2].name).toBe('Science Fiction');
    });
  });

  describe('Validation', () => {
    it('should throw error if name is empty', () => {
      expect(() => {
        new GenreTag({
          id: uuidv4(),
          name: '',
        });
      }).toThrow('Genre tag name cannot be empty');
    });

    it('should throw error if name exceeds 30 characters', () => {
      const longName = 'a'.repeat(31);
      expect(() => {
        new GenreTag({
          id: uuidv4(),
          name: longName,
        });
      }).toThrow('Genre tag name cannot exceed 30 characters');
    });

    it('should trim whitespace from name', () => {
      const tag = new GenreTag({
        id: uuidv4(),
        name: '  Action  ',
      });

      expect(tag.name).toBe('Action');
    });

    it('should throw error if name is only whitespace', () => {
      expect(() => {
        new GenreTag({
          id: uuidv4(),
          name: '   ',
        });
      }).toThrow('Genre tag name cannot be empty');
    });
  });

  describe('Business Methods', () => {
    it('should update name', () => {
      const tag = new GenreTag({
        id: uuidv4(),
        name: 'Original Name',
      });

      tag.updateName('New Name');
      expect(tag.name).toBe('New Name');
    });

    it('should validate when updating name', () => {
      const tag = new GenreTag({
        id: uuidv4(),
        name: 'Action',
      });

      expect(() => tag.updateName('')).toThrow('Genre tag name cannot be empty');
      expect(() => tag.updateName('a'.repeat(31))).toThrow('Genre tag name cannot exceed 30 characters');
    });

    it('should trim whitespace when updating name', () => {
      const tag = new GenreTag({
        id: uuidv4(),
        name: 'Action',
      });

      tag.updateName('  Comedy  ');
      expect(tag.name).toBe('Comedy');
    });
  });

  describe('Equality', () => {
    it('should consider tags equal if they have the same id', () => {
      const id = uuidv4();
      const tag1 = new GenreTag({ id, name: 'Action' });
      const tag2 = new GenreTag({ id, name: 'Action' });

      expect(tag1.equals(tag2)).toBe(true);
    });

    it('should consider tags different if they have different ids', () => {
      const tag1 = new GenreTag({ id: uuidv4(), name: 'Action' });
      const tag2 = new GenreTag({ id: uuidv4(), name: 'Action' });

      expect(tag1.equals(tag2)).toBe(false);
    });

    it('should consider tags different if comparing with non-GenreTag', () => {
      const tag = new GenreTag({ id: uuidv4(), name: 'Action' });

      expect(tag.equals(null as any)).toBe(false);
      expect(tag.equals({ id: tag.id, name: 'Action' } as any)).toBe(false);
    });
  });
});
