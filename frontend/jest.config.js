<<<<<<< HEAD
module.exports = {
=======
export default {
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
<<<<<<< HEAD
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
=======
    '^../../contexts/(.*)$': '<rootDir>/src/contexts/$1',
  },
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.vite/',
    '/dist/',
    '/coverage/',
    '/tests/',
    '/src/types/',
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
<<<<<<< HEAD
=======
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
};
