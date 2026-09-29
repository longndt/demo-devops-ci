const request = require('supertest');
const app = require('../app');

// Mock the pg Pool to avoid needing a real PostgreSQL database
jest.mock('pg', () => {
   const mockQuery = jest.fn();
   const mockPool = {
      query: mockQuery,
      on: jest.fn(),
      end: jest.fn(),
   };

   return {
      Pool: jest.fn(() => mockPool),
   };
});

describe('Student Manager API with PostgreSQL', () => {
   let server;
   let mockPool;

   beforeEach(() => {
      const pg = require('pg');
      mockPool = new pg.Pool();
      mockPool.query.mockClear();
   });

   afterEach(() => {
      if (server) {
         server.close();
      }
   });

   // Test GET /api/students - Get all students
   test('GET /api/students should return all students', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({
         rows: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
         ],
      });

      const res = await request(app).get('/api/students');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
   });

   // Test GET /api/students/:id - Get single student
   test('GET /api/students/:id should return a single student', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({
         rows: [{ id: 1, name: 'Alice', email: 'alice@example.com' }],
      });

      const res = await request(app).get('/api/students/1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('email');
   });

   // Test GET /api/students/:id with invalid ID
   test('GET /api/students/:id should return 404 for non-existent student', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/students/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
   });

   // Test POST /api/students - Create new student
   test('POST /api/students should create a new student', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({
         rows: [{ id: 1, name: 'David Lee', email: 'david@example.com' }],
      });

      const res = await request(app)
         .post('/api/students')
         .send({ name: 'David Lee', email: 'david@example.com' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('David Lee');
   });

   // Test POST /api/students with missing fields
   test('POST /api/students should return 400 if name or email is missing', async () => {
      const res = await request(app)
         .post('/api/students')
         .send({ name: 'John Doe' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
   });

   // Test POST /api/students with duplicate email
   test('POST /api/students should return 400 if email already exists', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      const duplicateError = new Error('Duplicate email');
      duplicateError.code = '23505';
      mockPool.query.mockRejectedValueOnce(duplicateError);

      const res = await request(app)
         .post('/api/students')
         .send({ name: 'Second', email: 'duplicate@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email already exists');
   });

   // Test PUT /api/students/:id - Update student
   test('PUT /api/students/:id should update a student', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({
         rows: [{ id: 1, name: 'Updated Name', email: 'updated@example.com' }],
      });

      const res = await request(app)
         .put('/api/students/1')
         .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Name');
   });

   // Test PUT /api/students/:id with invalid ID
   test('PUT /api/students/:id should return 404 for non-existent student', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
         .put('/api/students/99999')
         .send({ name: 'Test' });

      expect(res.statusCode).toBe(404);
   });

   // Test DELETE /api/students/:id - Delete student
   test('DELETE /api/students/:id should delete a student', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({
         rows: [{ id: 1, name: 'To Delete', email: 'delete@example.com' }],
      });

      const res = await request(app).delete('/api/students/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
   });

   // Test DELETE /api/students/:id with invalid ID
   test('DELETE /api/students/:id should return 404 for non-existent student', async () => {
      const mockPool = require('pg').Pool.mock.results[0].value;
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).delete('/api/students/99999');
      expect(res.statusCode).toBe(404);
   });

   // intentionally failing test
   test('this test will TRUE', () => {
      expect(1 + 1).toBe(2);
   });
});
