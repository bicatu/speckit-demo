import { describe, it, expect, beforeEach } from '@jest/globals';
import { DeleteStreamingPlatformCommand } from '../../../../src/application/commands/platforms/DeleteStreamingPlatformCommand';

describe('DeleteStreamingPlatformCommand', () => {
  let validCommandData: {
    platformId: string;
  };

  beforeEach(() => {
    validCommandData = {
      platformId: crypto.randomUUID(),
    };
  });

  describe('constructor validation', () => {
    it('should create command with valid platform ID', () => {
      const command = new DeleteStreamingPlatformCommand(validCommandData);

      expect(command.platformId).toBe(validCommandData.platformId);
    });

    it('should throw error when platformId is missing', () => {
      const invalidData = {} as any;

      expect(() => new DeleteStreamingPlatformCommand(invalidData)).toThrow();
    });

    it('should throw error when platformId is empty string', () => {
      const invalidData = { platformId: '' };

      expect(() => new DeleteStreamingPlatformCommand(invalidData)).toThrow();
    });
  });
});
