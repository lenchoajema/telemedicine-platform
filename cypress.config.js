// Cypress configuration
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/commands.js',
    specPattern: 'cypress/e2e/**/*.spec.js',
  },
};
