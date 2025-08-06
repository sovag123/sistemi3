const { setupDatabase, teardownDatabase } = require('./setup/testDb');

beforeAll(async () => {
  console.log('Setting up tests...');
  await setupDatabase();
}, 30000);

afterAll(async () => {
  await teardownDatabase();
  console.log('Tests completed');
}, 30000);