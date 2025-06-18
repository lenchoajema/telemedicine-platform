// Enhanced Jest configuration for comprehensive backend testing
export default {
  // Test environment
  testEnvironment: 'node',
  
  // Enable ES modules
  preset: 'es-jest',
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/__tests__/',
    '/tests/'
  ],
  
  // Coverage thresholds for quality gates
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // Specific thresholds for critical modules
    './src/modules/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/modules/appointments/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module name mapping for ES modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }]
  },
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,
  
  // Parallel test execution
  maxWorkers: '50%',
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test results output
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test_results',
      outputName: 'backend-test-results.xml'
    }]
  ]
};
