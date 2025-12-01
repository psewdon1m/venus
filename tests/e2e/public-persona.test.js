// End-to-end tests for public persona functionality
// Tests both API endpoint /api/public/:slug and frontend page [slug]

const { test, expect } = require('@playwright/test');

test.describe('Public Persona E2E Tests', () => {
  test('should load public persona via API', async ({ request }) => {
    // First, create a test account and persona via API
    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: 'test@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
      }
    });

    expect(registerResponse.ok()).toBeTruthy();
    const { user } = await registerResponse.json().then(r => r.data);

    // Create a persona
    const personaResponse = await request.post('/api/personas', {
      data: {
        displayName: 'Test Persona',
        manifest: 'Test portfolio'
      }
    });

    expect(personaResponse.ok()).toBeTruthy();
    const { persona } = await personaResponse.json().then(r => r.data);

    // Publish the persona
    const publishResponse = await request.post(`/api/personas/${persona.id}/publish`);
    expect(publishResponse.ok()).toBeTruthy();

    // Test public API endpoint
    const publicResponse = await request.get(`/api/public/${persona.slug}`);
    expect(publicResponse.ok()).toBeTruthy();

    const publicData = await publicResponse.json();
    expect(publicData.success).toBe(true);
    expect(publicData.data.persona.displayName).toBe('Test Persona');
    expect(publicData.data.persona.slug).toBe(persona.slug);
  });

  test('should render public persona page', async ({ page, request }) => {
    // First create and publish a persona
    const registerResponse = await request.post('/api/auth/register', {
      data: {
        email: 'test2@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!'
      }
    });

    expect(registerResponse.ok()).toBeTruthy();
    const { user } = await registerResponse.json().then(r => r.data);

    // Create a persona
    const personaResponse = await request.post('/api/personas', {
      data: {
        displayName: 'Test Persona Page',
        manifest: 'Test portfolio for page rendering'
      }
    });

    expect(personaResponse.ok()).toBeTruthy();
    const { persona } = await personaResponse.json().then(r => r.data);

    // Publish the persona
    const publishResponse = await request.post(`/api/personas/${persona.id}/publish`);
    expect(publishResponse.ok()).toBeTruthy();

    // Navigate to the dynamic persona page
    await page.goto(`/${persona.slug}`);

    // Check that page loads without errors
    await expect(page).toHaveTitle(/Venus Platform/);

    // Check for persona content
    await expect(page.locator('h1')).toContainText('Test Persona Page');
  });

  test('should handle non-existent persona gracefully', async ({ request, page }) => {
    // Test API endpoint
    const response = await request.get('/api/public/non-existent-slug');
    expect(response.status()).toBe(404);

    // Test frontend page - Next.js shows 404 page for notFound()
    await page.goto('/non-existent-slug');
    await expect(page).toHaveTitle(/404/);
    // Or check for Next.js default 404 content
    await expect(page.locator('text=404')).toBeVisible();
  });
});