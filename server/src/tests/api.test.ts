import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Digital Paper Agenda API', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/settings should return settings object', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('language');
    expect(res.body).toHaveProperty('firstDayOfWeek');
  });

  it('GET /api/daily-agenda/:date should return agenda for 2025-10-15', async () => {
    const res = await request(app).get('/api/daily-agenda/2025-10-15');
    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2025-10-15');
    expect(res.body.priorities).toBeInstanceOf(Array);
    expect(res.body.priorities.length).toBe(3);
    expect(res.body.tasks).toBeInstanceOf(Array);
    expect(res.body.events).toBeInstanceOf(Array);
  });

  it('POST /api/tasks and PUT /api/tasks/:id should work', async () => {
    const createRes = await request(app).post('/api/tasks').send({
      title: 'Test ink ledger line',
      date: '2025-10-15',
      priority: 'normal',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.title).toBe('Test ink ledger line');
    const taskId = createRes.body.id;

    // Toggle completion
    const updateRes = await request(app).put(`/api/tasks/${taskId}`).send({
      isCompleted: true,
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.isCompleted).toBe(true);

    // Delete task
    const delRes = await request(app).delete(`/api/tasks/${taskId}`);
    expect(delRes.status).toBe(200);
  });

  it('GET /api/monthly-agenda/2025/10 should return days in October', async () => {
    const res = await request(app).get('/api/monthly-agenda/2025/10');
    expect(res.status).toBe(200);
    expect(res.body.days.length).toBe(31);
  });

  it('GET /api/notes should return notes list', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
