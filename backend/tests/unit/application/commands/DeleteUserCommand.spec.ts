import { DeleteUserCommand } from '../../../../src/application/commands/users/DeleteUserCommand';

describe('DeleteUserCommand', () => {
  describe('constructor', () => {
    it('should create a command with userId', () => {
      const userId = crypto.randomUUID();
      const command = new DeleteUserCommand(userId);

      expect(command.userId).toBe(userId);
    });

    it('should throw error if userId is empty string', () => {
      expect(() => new DeleteUserCommand('')).toThrow();
    });

    it('should throw error if userId is invalid UUID format', () => {
      expect(() => new DeleteUserCommand('not-a-uuid')).toThrow();
    });
  });

  describe('validation', () => {
    it('should accept valid UUID', () => {
      const validUuid = crypto.randomUUID();
      expect(() => new DeleteUserCommand(validUuid)).not.toThrow();
    });

    it('should validate UUID format', () => {
      const invalidUuids = [
        '123',
        'abc-def-ghi',
        '00000000-0000-0000-0000-00000000000g',
        '',
        ' ',
      ];

      invalidUuids.forEach((invalidUuid) => {
        expect(() => new DeleteUserCommand(invalidUuid)).toThrow();
      });
    });
  });
});
