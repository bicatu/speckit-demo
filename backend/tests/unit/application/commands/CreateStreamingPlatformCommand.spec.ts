import { describe, it, expect, beforeEach } from '@jest/globals';
import { CreateStreamingPlatformCommand } from '../../../../src/application/commands/platforms/CreateStreamingPlatformCommand';

describe('CreateStreamingPlatformCommand', () => {
  let validCommandData: {
    name: string;
  };

  beforeEach(() => {
    validCommandData = {
      name: 'Netflix',
    };
  });

  describe('constructor validation', () => {
    it('should create command with valid name', () => {
      const command = new CreateStreamingPlatformCommand(validCommandData);

      expect(command.name).toBe(validCommandData.name);
    });

    it('should throw error when name is missing', () => {
      const invalidData = {} as any;

      expect(() => new CreateStreamingPlatformCommand(invalidData)).toThrow();
    });

    it('should throw error when name is empty string', () => {
      const invalidData = { name: '' };

      expect(() => new CreateStreamingPlatformCommand(invalidData)).toThrow();
    });

    it('should throw error when name is only whitespace', () => {
      const invalidData = { name: '   ' };

      expect(() => new CreateStreamingPlatformCommand(invalidData)).toThrow();
    });

    it('should accept name with special characters', () => {
      const data = { name: 'Disney+' };
      const command = new CreateStreamingPlatformCommand(data);

      expect(command.name).toBe(data.name);
    });

    it('should accept name with numbers', () => {
      const data = { name: 'Channel 4' };
      const command = new CreateStreamingPlatformCommand(data);

      expect(command.name).toBe(data.name);
    });
  });
});
