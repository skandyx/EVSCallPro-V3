// FIX: Replaced the incorrect file path reference with the standard types reference to resolve Cypress type definition issues.
/// <reference types="cypress" />

// This triple-slash directive is necessary for TypeScript to recognize
// Cypress's global commands like `cy`, `describe`, and `it`.

describe('Critical Application Flow', () => {
  it('should load the login page, log in as an admin, and see the dashboard', () => {
    // Visit the root URL
    cy.visit('/');

    // Check if the login form is visible
    cy.get('h1').contains('Architecte de Solutions');
    cy.get('form').should('be.visible');

    // Enter credentials for an admin user (from mockData)
    cy.get('input[name="loginId"]').type('9000');
    cy.get('input[name="password"]').type('9000');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // After login, the main app should be visible
    // Check for a key element in the admin dashboard, like the sidebar
    cy.get('aside').should('be.visible');
    cy.get('aside').contains('Solution Archi');
    
    // Check if the user's name is displayed
    cy.get('aside').contains('Admin Principal');

    // Check if the main content area is displaying a feature
    cy.get('main').contains('Utilisateurs');
  });

   it('should log in as an agent and see the agent view', () => {
    cy.visit('/');

    // Enter credentials for an agent user (from mockData)
    cy.get('input[name="loginId"]').type('1001');
    cy.get('input[name="password"]').type('1001');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // After login, the agent view should be visible
    cy.get('header').contains("Interface Agent");
    cy.get('main').contains("État de l'Agent");
    // Updated test assertion to be more specific to the content displayed
    // when an agent logs in and is waiting for a call.
    cy.get('main').contains("Le script s'affichera ici.");
  });
});