const request = require('supertest');
const app = require('../../app');

describe('Product Controller', () => {
  test('should get all products', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
    expect(Array.isArray(response.body.products)).toBe(true);
  });

  test('should get a product by ID', async () => {
    const response = await request(app).get('/api/products/1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('product');
    expect(response.body.product.id).toBe(1);
  });

  test('should return 404 for non-existent product', async () => {
    const response = await request(app).get('/api/products/999');
    expect(response.status).toBe(404);
  });
});