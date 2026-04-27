describe('Dashboard Mobile UX', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.visit('/');
  });

  it('should display the dashboard with correct responsive layout', () => {
    cy.get('h1').contains('Guddu Traders').should('be.visible');
    // Check for stat grid cards
    cy.get('.stat-grid .card').should('have.length.at.least', 3);
    
    // Verify profit display is visible
    cy.contains('Net Profit').should('be.visible');
    cy.get('h2').contains('PKR').should('be.visible');
  });

  it('should have accessible navigation via hamburger menu', () => {
    cy.openSidebar();
    cy.get('[data-testid="sidebar"]').should('be.visible');
    cy.get('[data-testid="sidebar"]').contains('Inventory').should('be.visible');
  });

  it('should verify Adjust Cash button accessibility', () => {
    cy.get('button').contains('Adjust Cash').should('be.visible');
    cy.checkButtonAccessibility();
  });
});
