// cypress/support/commands.js
// Custom commands for authentication

Cypress.Commands.add('register', (user) => {
  return cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: user,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('login', (email, password) => {
  return cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
  }).then((resp) => {
    const token = resp.body.data.token;
    window.localStorage.setItem('token', token);
    return resp;
  });
});
