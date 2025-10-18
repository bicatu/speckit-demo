import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMock } from 'ts-jest-mocker';
import { UpdateEntryCommand } from '../../../../src/application/commands/entries/UpdateEntryCommand';
import { UpdateEntryCommandHandler } from '../../../../src/application/commands/entries/UpdateEntryCommandHandler';
import { IEntryRepository } from '../../../../src/domain/repositories/IEntryRepository';
import { IGenreTagRepository } from '../../../../src/domain/repositories/IGenreTagRepository';
import { Entry } from '../../../../src/domain/entities/Entry';
import { GenreTag } from '../../../../src/domain/entities/GenreTag';

describe('UpdateEntryCommandHandler', () => {
  let handler: UpdateEntryCommandHandler;
  let mockEntryRepository: jest.Mocked<IEntryRepository>;
  let mockGenreTagRepository: jest.Mocked<IGenreTagRepository>;

  beforeEach(() => {
    mockEntryRepository = createMock<IEntryRepository>();
    mockGenreTagRepository = createMock<IGenreTagRepository>();
    handler = new UpdateEntryCommandHandler(mockEntryRepository, mockGenreTagRepository);
  });

  describe('execute', () => {
    it('should update entry title successfully', async () => {
      const entryId = crypto.randomUUID();
      const existingEntry = new Entry({
        id: entryId,
        title: 'Original Title',
        mediaType: 'film',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateEntryCommand({
        entryId,
        title: 'Updated Title',
      });

      mockEntryRepository.findById.mockResolvedValue(existingEntry);
      mockEntryRepository.findByTitle.mockResolvedValue(null);
      mockEntryRepository.update.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockEntryRepository.findById).toHaveBeenCalledWith(entryId);
      expect(mockEntryRepository.findByTitle).toHaveBeenCalledWith('Updated Title');
      expect(mockEntryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: entryId,
          title: 'Updated Title',
        })
      );
    });

    it('should throw error when entry not found', async () => {
      const entryId = crypto.randomUUID();
      const command = new UpdateEntryCommand({
        entryId,
        title: 'Updated Title',
      });

      mockEntryRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow('Entry not found');
    });

    it('should throw error when updated title already exists', async () => {
      const entryId = crypto.randomUUID();
      const otherId = crypto.randomUUID();
      const existingEntry = new Entry({
        id: entryId,
        title: 'Original Title',
        mediaType: 'film',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const conflictingEntry = new Entry({
        id: otherId,
        title: 'Existing Title',
        mediaType: 'series',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateEntryCommand({
        entryId,
        title: 'Existing Title',
      });

      mockEntryRepository.findById.mockResolvedValue(existingEntry);
      mockEntryRepository.findByTitle.mockResolvedValue(conflictingEntry);

      await expect(handler.execute(command)).rejects.toThrow('Title already exists');
    });

    it('should allow updating to same title', async () => {
      const entryId = crypto.randomUUID();
      const existingEntry = new Entry({
        id: entryId,
        title: 'Same Title',
        mediaType: 'film',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new UpdateEntryCommand({
        entryId,
        title: 'Same Title',
        mediaType: 'series',
      });

      mockEntryRepository.findById.mockResolvedValue(existingEntry);
      mockEntryRepository.findByTitle.mockResolvedValue(existingEntry);
      mockEntryRepository.update.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockEntryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: entryId,
          title: 'Same Title',
          mediaType: 'series',
        })
      );
    });

    it('should update entry tags successfully', async () => {
      const entryId = crypto.randomUUID();
      const tagId1 = crypto.randomUUID();
      const tagId2 = crypto.randomUUID();

      const existingEntry = new Entry({
        id: entryId,
        title: 'Movie Title',
        mediaType: 'film',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const tag1 = new GenreTag({ id: tagId1, name: 'Action' });
      const tag2 = new GenreTag({ id: tagId2, name: 'Drama' });

      const command = new UpdateEntryCommand({
        entryId,
        tagIds: [tagId1, tagId2],
      });

      mockEntryRepository.findById.mockResolvedValue(existingEntry);
      mockGenreTagRepository.findByIds.mockResolvedValue([tag1, tag2]);
      mockEntryRepository.update.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockGenreTagRepository.findByIds).toHaveBeenCalledWith([tagId1, tagId2]);
      expect(mockEntryRepository.update).toHaveBeenCalled();
    });

    it('should throw error when tag does not exist', async () => {
      const entryId = crypto.randomUUID();
      const tagId1 = crypto.randomUUID();
      const tagId2 = crypto.randomUUID();

      const existingEntry = new Entry({
        id: entryId,
        title: 'Movie Title',
        mediaType: 'film',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const tag1 = new GenreTag({ id: tagId1, name: 'Action' });

      const command = new UpdateEntryCommand({
        entryId,
        tagIds: [tagId1, tagId2],
      });

      mockEntryRepository.findById.mockResolvedValue(existingEntry);
      mockGenreTagRepository.findByIds.mockResolvedValue([tag1]);

      await expect(handler.execute(command)).rejects.toThrow('One or more tags not found');
    });

    it('should update multiple fields at once', async () => {
      const entryId = crypto.randomUUID();
      const platformId = crypto.randomUUID();
      const tagId = crypto.randomUUID();

      const existingEntry = new Entry({
        id: entryId,
        title: 'Original Title',
        mediaType: 'film',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const tag = new GenreTag({ id: tagId, name: 'Thriller' });

      const command = new UpdateEntryCommand({
        entryId,
        title: 'New Title',
        mediaType: 'series',
        platformId,
        tagIds: [tagId],
      });

      mockEntryRepository.findById.mockResolvedValue(existingEntry);
      mockEntryRepository.findByTitle.mockResolvedValue(null);
      mockGenreTagRepository.findByIds.mockResolvedValue([tag]);
      mockEntryRepository.update.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockEntryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: entryId,
          title: 'New Title',
          mediaType: 'series',
          platformId,
        })
      );
    });

    it('should update updatedAt timestamp', async () => {
      const entryId = crypto.randomUUID();
      const existingEntry = new Entry({
        id: entryId,
        title: 'Original Title',
        mediaType: 'film',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const command = new UpdateEntryCommand({
        entryId,
        title: 'Updated Title',
      });

      mockEntryRepository.findById.mockResolvedValue(existingEntry);
      mockEntryRepository.findByTitle.mockResolvedValue(null);
      mockEntryRepository.update.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(mockEntryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );

      const updatedEntry = mockEntryRepository.update.mock.calls[0][0];
      expect(updatedEntry.updatedAt.getTime()).toBeGreaterThan(existingEntry.updatedAt.getTime());
    });
  });
});
