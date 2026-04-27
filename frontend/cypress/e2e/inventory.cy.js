describe('Inventory Mobile UX', () => {
  beforeEach(() => {
    cy.setMobileViewport();
    cy.visit('/inventory');
  });

  it('should display product list and FAB', () => {
    cy.get('h1').contains('Inventory').should('be.visible');
    // FAB should be visible on mobile
    cy.get('[data-testid="add-product-fab"]').should('be.visible');
  });

  it('should open add product modal via FAB', () => {
    cy.get('[data-testid="add-product-fab"]').click();
    cy.get('.modal-overlay').should('be.visible');
    cy.get('[data-testid="modal-title"]').contains('New Product').should('be.visible');
    // Check for tap target sizes in modal
    cy.get('input').first().should('have.css', 'min-height', '44px');
  });

  it('should show custom delete confirmation modal if products exist', () => {
    // Check if there are any products
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="delete-product-btn"]').length > 0) {
        cy.get('[data-testid="delete-product-btn"]').first().click();
        cy.contains('Are you sure').should('be.visible');
        cy.contains('Yes, Delete').should('be.visible');
      } else {
        cy.log('No products found to test delete');
      }
    });
  });
});
