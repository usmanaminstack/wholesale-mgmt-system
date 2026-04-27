describe('Payments Mobile UX', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.visit('/payments');
  });

  it('should display payments list and FAB', () => {
    cy.get('h1').contains('Cash Payments').should('be.visible');
    cy.get('[data-testid="record-payment-fab"]').should('be.visible');
  });

  it('should open record entry modal via FAB', () => {
    cy.get('[data-testid="record-payment-fab"]').click();
    cy.get('.modal-overlay').should('be.visible');
    cy.get('[data-testid="modal-title"]').contains('Record Cash Flow').should('be.visible');
    
    // Check flow toggle buttons accessibility
    cy.contains('Collection').should('be.visible').invoke('outerHeight').should('be.at.least', 44);
    cy.contains('Settlement').should('be.visible').invoke('outerHeight').should('be.at.least', 44);
  });

  it('should verify desktop buttons are hidden on mobile', () => {
    cy.get('button').contains('Record Entry').should('not.be.visible');
  });
});
