// cypress/e2e/auth.spec.js
describe('Authentication Flow', () => {
  const newUser = {
    email: 'e2e.patient@example.com',
    password: 'password123',
    role: 'patient',
    profile: { firstName: 'E2E', lastName: 'Patient' },
  };

  it('should register a new patient', () => {
    // Intercept register API to wait on navigation
    cy.intercept('POST', '/api/auth/register').as('registerReq');
    cy.visit('/register');
    cy.get('input[name="firstName"]').type(newUser.profile.firstName);
    cy.get('input[name="lastName"]').type(newUser.profile.lastName);
    cy.get('input[name="email"]').type(newUser.email);
    cy.get('input[name="password"]').type(newUser.password);
    cy.get('input[name="confirmPassword"]').type(newUser.password);
    cy.get('input[value="patient"]').check();
    cy.get('button[type="submit"]').click();
    // Wait for registration to complete
    cy.wait('@registerReq');
    // Verify redirect to appointments
    cy.url({ timeout: 10000 }).should('include', '/appointments');
  });

  it('should login existing user', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(newUser.email);
    cy.get('input[type="password"]').type(newUser.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/appointments');
  });
});
