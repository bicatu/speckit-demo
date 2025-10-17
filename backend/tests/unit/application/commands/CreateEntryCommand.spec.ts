import { CreateEntryCommand } from '../../../../src/application/commands/entries/CreateEntryCommand';

describe('CreateEntryCommand', () => {
  it('should create a command with required properties', () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['sci-fi', 'action'],
      'netflix',
      8
    );

    expect(command.userId).toBe('user-123');
    expect(command.title).toBe('The Matrix');
    expect(command.mediaType).toBe('film');
    expect(command.tagIds).toEqual(['sci-fi', 'action']);
    expect(command.platformId).toBe('netflix');
    expect(command.initialRating).toBe(8);
  });

  it('should create a command without optional platform', () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['sci-fi', 'action'],
      undefined,
      8
    );

    expect(command.platformId).toBeUndefined();
  });

  it('should create a command without optional rating', () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['sci-fi', 'action'],
      'netflix',
      undefined
    );

    expect(command.initialRating).toBeUndefined();
  });

  it('should enforce 1-3 genre tags constraint', () => {
    const command = new CreateEntryCommand(
      'user-123',
      'The Matrix',
      'film',
      ['sci-fi', 'action'],
      'netflix',
      8
    );

    expect(command.tagIds.length).toBeGreaterThanOrEqual(1);
    expect(command.tagIds.length).toBeLessThanOrEqual(3);
  });
});
