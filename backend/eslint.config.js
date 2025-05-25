// eslint.config.js for backend (Node.js)
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      // Debug: allow debugger statements for troubleshooting
      'no-debugger': 'off',
      // Debug: allow console.log for troubleshooting
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.object.name="console"][callee.property.name!="log"]',
          message: 'Only console.log is allowed for debugging.'
        }
      ],
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        global: 'writable',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
];
