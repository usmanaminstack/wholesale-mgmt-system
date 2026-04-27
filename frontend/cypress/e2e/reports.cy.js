describe('Reports Mobile UX', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.visit('/reports');
  });

  it('should display profit summary cards', () => {
    cy.get('h1').contains('Analytics').should('be.visible');
    cy.contains('Net Profit Position').should('be.visible');
  });

  it('should allow horizontal scrolling for large tables', () => {
    // Click View itemized list to show table
    cy.contains('View itemized list').click();
    
    // Check if table wrapper exists and has overflow-x auto
    cy.get('[data-testid="scrollable-table-wrapper"]').should('have.css', 'overflow-x', 'auto');
  });
});
