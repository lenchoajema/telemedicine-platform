const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Set JWT_SECRET so all test files and the app use the same secret during test runs
process.env.JWT_SECRET = 'test_secret';

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global error handler override for tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
