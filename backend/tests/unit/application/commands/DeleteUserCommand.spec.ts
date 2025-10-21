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
  });

  describe('validation', () => {
    it('should accept valid UUID', () => {
      const validUuid = crypto.randomUUID();
      expect(() => new DeleteUserCommand(validUuid)).not.toThrow();
    });

    it('should reject empty or whitespace strings', () => {
      const invalidInputs = [
        '',
        ' ',
      ];

      invalidInputs.forEach((invalidInput) => {
        expect(() => new DeleteUserCommand(invalidInput)).toThrow();
      });
    });
  });
});
