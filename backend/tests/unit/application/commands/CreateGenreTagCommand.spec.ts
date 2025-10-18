import { describe, it, expect, beforeEach } from '@jest/globals';
import { CreateGenreTagCommand } from '../../../../src/application/commands/tags/CreateGenreTagCommand';

describe('CreateGenreTagCommand', () => {
  let validCommandData: {
    name: string;
  };

  beforeEach(() => {
    validCommandData = {
      name: 'Action',
    };
  });

  describe('constructor validation', () => {
    it('should create command with valid name', () => {
      const command = new CreateGenreTagCommand(validCommandData);

      expect(command.name).toBe(validCommandData.name);
    });

    it('should throw error when name is missing', () => {
      const invalidData = {} as any;

      expect(() => new CreateGenreTagCommand(invalidData)).toThrow();
    });

    it('should throw error when name is empty string', () => {
      const invalidData = { name: '' };

      expect(() => new CreateGenreTagCommand(invalidData)).toThrow();
    });

    it('should throw error when name is only whitespace', () => {
      const invalidData = { name: '   ' };

      expect(() => new CreateGenreTagCommand(invalidData)).toThrow();
    });

    it('should accept name with multiple words', () => {
      const data = { name: 'Science Fiction' };
      const command = new CreateGenreTagCommand(data);

      expect(command.name).toBe(data.name);
    });

    it('should accept name with hyphens', () => {
      const data = { name: 'Action-Adventure' };
      const command = new CreateGenreTagCommand(data);

      expect(command.name).toBe(data.name);
    });
  });
});
