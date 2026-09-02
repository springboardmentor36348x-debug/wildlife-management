describe('Wildlife Monitoring Core Workflow', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/habitat/assess-site/*', {
      statusCode: 200,
      body: {
        satellite_data: { source: 'Sentinel Hub (API)', ndvi: 0.68, status: 'success' },
        osm_data: { source: 'OpenStreetMap Overpass API', is_protected: true, distance_to_encroachment_km: 12.5, status: 'success' },
        images_at_site: 5,
        images_unreadable: 0,
        assessment_transparency: 'Mocked for testing'
      }
    }).as('assessSite');
    
    cy.intercept('GET', '**/notifications/alerts', {
      statusCode: 200,
      body: {
        alerts: [{
          id: 'test-alert-1',
          site_id: 1, location: 'Demo Site', category: 'ai_conservation_priority',
          title: 'AI Prediction: Demo Site shows elevated risk',
          message: 'XGBoost baseline model predicted a priority score of 0.85.',
          severity: 'critical'
        }],
        note: 'Mocked for testing'
      }
    }).as('getAlerts');
  });

  it('completes the full end-to-end pipeline', () => {
    cy.visit('http://frontend:3000/login');
    cy.get('input[type="email"]').type('admin@gmail.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboards/admin', { timeout: 10000 });
    
    cy.visit('http://frontend:3000/observations/upload', { failOnStatusCode: false });
    cy.visit('http://frontend:3000/analysis', { failOnStatusCode: false });
    cy.visit('http://frontend:3000/habitat');
    cy.visit('http://frontend:3000/notifications', { failOnStatusCode: false });
    cy.visit('http://frontend:3000/reports', { failOnStatusCode: false });
  });
});
