/* cypress/support/commands.js */
Cypress.Commands.add('login', () => {
  // Authentication not currently implemented in this project
});

Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(390, 844);
});

Cypress.Commands.add('openSidebar', () => {
  cy.get('[data-testid="hamburger-menu"]').click();
});

Cypress.Commands.add('checkButtonAccessibility', () => {
  // Verify each visible button has a minimum height of 44px (tap target size)
  cy.get('button, .primary, .fab-button').filter(':visible').each($btn => {
    cy.wrap($btn).invoke('outerHeight').then(height => {
      expect(height).to.be.at.least(44);
    });
  });
});
