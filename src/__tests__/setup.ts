// Test setup file
// This file runs before all tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock external services that aren't needed for unit tests
jest.mock('../messaging', () => ({
  publishTaskAssigned: jest.fn().mockResolvedValue(undefined),
  initializeMessaging: jest.fn().mockResolvedValue(undefined),
  shutdownMessaging: jest.fn().mockResolvedValue(undefined),
}));

// Increase timeout for integration tests
jest.setTimeout(30000);
