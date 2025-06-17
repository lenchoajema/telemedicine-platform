<<<<<<< HEAD
module.exports = {
=======
// jest.config.js (ESM)
export default {
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
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
<<<<<<< HEAD
  setupFilesAfterEnv: ['./tests/setup.js'],
=======
  setupFilesAfterEnv: ['./tests/setup.cjs'],
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
<<<<<<< HEAD
  restoreMocks: true
=======
  restoreMocks: true,
  transform: {}, // disables babel, use native ESM
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
};
