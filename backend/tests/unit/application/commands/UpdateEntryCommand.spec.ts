import { describe, it, expect, beforeEach } from '@jest/globals';
import { UpdateEntryCommand } from '../../../../src/application/commands/entries/UpdateEntryCommand';

describe('UpdateEntryCommand', () => {
  let validCommandData: {
    entryId: string;
    title?: string;
    mediaType?: 'film' | 'series';
    platformId?: string;
    tagIds?: string[];
  };

  beforeEach(() => {
    validCommandData = {
      entryId: crypto.randomUUID(),
      title: 'Updated Movie Title',
      mediaType: 'film',
      platformId: crypto.randomUUID(),
      tagIds: [crypto.randomUUID(), crypto.randomUUID()],
    };
  });

  describe('constructor validation', () => {
    it('should create command with all fields', () => {
      const command = new UpdateEntryCommand(validCommandData);

      expect(command.entryId).toBe(validCommandData.entryId);
      expect(command.title).toBe(validCommandData.title);
      expect(command.mediaType).toBe(validCommandData.mediaType);
      expect(command.platformId).toBe(validCommandData.platformId);
      expect(command.tagIds).toEqual(validCommandData.tagIds);
    });

    it('should create command with only entryId', () => {
      const minimalData = { entryId: validCommandData.entryId };
      const command = new UpdateEntryCommand(minimalData);

      expect(command.entryId).toBe(validCommandData.entryId);
      expect(command.title).toBeUndefined();
      expect(command.mediaType).toBeUndefined();
      expect(command.platformId).toBeUndefined();
      expect(command.tagIds).toBeUndefined();
    });

    it('should create command with only title update', () => {
      const titleOnlyData = {
        entryId: validCommandData.entryId,
        title: 'New Title',
      };
      const command = new UpdateEntryCommand(titleOnlyData);

      expect(command.entryId).toBe(validCommandData.entryId);
      expect(command.title).toBe('New Title');
      expect(command.mediaType).toBeUndefined();
    });

    it('should create command with tagIds update', () => {
      const tagIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
      const tagsOnlyData = {
        entryId: validCommandData.entryId,
        tagIds,
      };
      const command = new UpdateEntryCommand(tagsOnlyData);

      expect(command.entryId).toBe(validCommandData.entryId);
      expect(command.tagIds).toEqual(tagIds);
    });

    it('should throw error when entryId is missing', () => {
      const invalidData = { ...validCommandData, entryId: undefined } as any;

      expect(() => new UpdateEntryCommand(invalidData)).toThrow();
    });

    it('should throw error when entryId is empty string', () => {
      const invalidData = { ...validCommandData, entryId: '' };

      expect(() => new UpdateEntryCommand(invalidData)).toThrow();
    });

    it('should throw error when title is empty string', () => {
      const invalidData = { ...validCommandData, title: '' };

      expect(() => new UpdateEntryCommand(invalidData)).toThrow();
    });

    it('should throw error when tagIds array has less than 1 element', () => {
      const invalidData = { ...validCommandData, tagIds: [] };

      expect(() => new UpdateEntryCommand(invalidData)).toThrow();
    });

    it('should throw error when tagIds array has more than 3 elements', () => {
      const invalidData = {
        ...validCommandData,
        tagIds: [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()],
      };

      expect(() => new UpdateEntryCommand(invalidData)).toThrow();
    });

    it('should throw error when mediaType is invalid', () => {
      const invalidData = { ...validCommandData, mediaType: 'invalid' as any };

      expect(() => new UpdateEntryCommand(invalidData)).toThrow();
    });
  });
});
