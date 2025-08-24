// Cypress E2E spec

// E2E: verify placeholders and input alignment change with locale
// Assumes header <select aria-label="Language"> is present

describe('i18n reading and writing behavior', () => {
  const goHome = () => cy.visit('/');

  const selectLanguage = (code) => {
    cy.get('select[aria-label="Language"]').should('exist').select(code, { force: true });
  };

  it('switches to Arabic (rtl): dir, placeholders, and input alignment', () => {
    goHome();

    // Default en
    cy.get('html').should('have.attr', 'dir', 'ltr');

    // Switch to ar
    selectLanguage('ar');

    // HTML dir should be rtl and body should have rtl class
    cy.get('html').should('have.attr', 'dir', 'rtl');
    cy.get('body').should('have.class', 'rtl');

    // Check a couple of inputs on public pages for alignment
    cy.contains('a', /contact/i).click();

    cy.get('input[placeholder]')
      .first()
      .should('have.css', 'direction', 'rtl')
      .and('have.css', 'text-align', 'right');

    cy.get('textarea[placeholder]')
      .first()
      .should('have.css', 'direction', 'rtl')
      .and('have.css', 'text-align', 'right');
  });

  it('switches to Amharic (am-ET): ethiopic class applied and writing remains ltr', () => {
    goHome();

    selectLanguage('am-ET');

    cy.get('html').should('have.attr', 'dir', 'ltr');
    cy.get('body').should('have.class', 'ethiopic');

    cy.contains('a', /contact/i).click();

    cy.get('input[placeholder]')
      .first()
      .should('have.css', 'direction', 'ltr')
      .and('have.css', 'text-align', 'left');
  });
});
