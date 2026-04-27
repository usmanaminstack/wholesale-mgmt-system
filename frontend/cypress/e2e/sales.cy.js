describe('Sales & Receipt Mobile UX', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.visit('/sales');
  });

  it('should display sales list and FAB', () => {
    cy.get('h1').contains('Sales').should('be.visible');
    cy.get('[data-testid="new-sale-fab"]').should('be.visible');
  });

  it('should verify receipt layout has 4 columns in one line if a sale exists', () => {
    // Look for View button in action-btn
    cy.get('body').then(($body) => {
      if ($body.find('button[title="View"]').length > 0) {
        cy.get('button[title="View"]').first().click();
        cy.get('[data-testid="pos-receipt"]').should('be.visible');
        
        // Check for 4 columns in the header
        cy.get('[data-testid="receipt-header"] th').should('have.length', 4);
        cy.get('[data-testid="receipt-header"]').contains('ITEM').should('be.visible');
        cy.get('[data-testid="receipt-header"]').contains('QTY').should('be.visible');
        cy.get('[data-testid="receipt-header"]').contains('PRICE').should('be.visible');
        cy.get('[data-testid="receipt-header"]').contains('TOTAL').should('be.visible');
      } else {
        cy.log('No sales found to test receipt');
      }
    });
  });
});
