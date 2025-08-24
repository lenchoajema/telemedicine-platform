// jest.config.js (ESM)
export default {
  testEnvironment: 'node',
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  testMatch: ['**/src/__tests__/**/*.test.mjs','**/src/__tests__/**/*.test.js','**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/'],
  // Use CommonJS setup file to allow require() in test environment
  setupFilesAfterEnv: ['./tests/setup.cjs'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
};
