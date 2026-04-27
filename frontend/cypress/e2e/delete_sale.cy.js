describe('Sale Deletion', () => {
  beforeEach(() => {
    cy.visit('/sales');
  });

  it('should delete a sale and verify network request', () => {
    // Intercept the delete request
    cy.intercept('DELETE', '**/api/sales/**').as('deleteSale');

    cy.get('body').then(($body) => {
      if ($body.find('button[title="Delete"]').length > 0) {
        // Click delete on the first row
        cy.get('button[title="Delete"]').first().click();
        
        // Handle window.confirm
        cy.on('window:confirm', () => true);

        // Wait for the delete request
        cy.wait('@deleteSale').then((interception) => {
          expect(interception.response.statusCode).to.eq(200);
          cy.log('Delete successful');
        });

        // Verify toast (if possible)
        cy.get('body').contains('deleted').should('be.visible');
      } else {
        cy.log('No sales found to delete');
      }
    });
  });
});
