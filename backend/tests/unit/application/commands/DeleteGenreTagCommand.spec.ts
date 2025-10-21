import { describe, it, expect, beforeEach } from '@jest/globals';
import { DeleteGenreTagCommand } from '../../../../src/application/commands/tags/DeleteGenreTagCommand';

describe('DeleteGenreTagCommand', () => {
  let validCommandData: {
    tagId: string;
  };

  beforeEach(() => {
    validCommandData = {
      tagId: crypto.randomUUID(),
    };
  });

  describe('constructor validation', () => {
    it('should create command with valid tag ID', () => {
      const command = new DeleteGenreTagCommand(validCommandData);

      expect(command.tagId).toBe(validCommandData.tagId);
    });

    it('should throw error when tagId is missing', () => {
      const invalidData = {} as any;

      expect(() => new DeleteGenreTagCommand(invalidData)).toThrow();
    });

    it('should throw error when tagId is empty string', () => {
      const invalidData = { tagId: '' };

      expect(() => new DeleteGenreTagCommand(invalidData)).toThrow();
    });
  });
});
