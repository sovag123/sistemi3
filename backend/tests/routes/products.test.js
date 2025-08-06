const request = require('supertest');
const app = require('../../app');

describe('Product Routes', () => {
	test('GET /api/products should return products list', async () => {
		const response = await request(app).get('/api/products');
		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('products');
		expect(response.body).toHaveProperty('pagination');
		expect(Array.isArray(response.body.products)).toBe(true);
	});

	test('GET /api/products/1 should return single product', async () => {
		const response = await request(app).get('/api/products/1');
		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('product');
		expect(response.body).toHaveProperty('images');
		expect(response.body).toHaveProperty('models');
	});

	test('GET /api/products/999 should return 404', async () => {
		const response = await request(app).get('/api/products/999');
		expect(response.status).toBe(404);
	});

	test('GET /api/health should return server status', async () => {
		const response = await request(app).get('/api/health');
		expect(response.status).toBe(200);
		expect(response.body.status).toBe('OK');
	});
});