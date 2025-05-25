// jest.config.js (ESM)
export default {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['./tests/setup.cjs'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transform: {}, // disables babel, use native ESM
};
