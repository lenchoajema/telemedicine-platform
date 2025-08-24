module.exports = {  testEnvironment: 'node',  transform: {},  testMatch: ['**/src/__tests__/**/*.test.js'],  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],
  moduleFileExtensions: ['js','mjs','json'],
  clearMocks: true,
  testTimeout: 30000,
};
