const request = require('supertest');
const { createApp } = require('../../src/app');
const container = require('../../src/container');

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/problems', () => {
    it('should return the list of problems', async () => {
      const res = await request(app).get('/api/problems');

      expect(res.status).toBe(200);
      expect(res.body.problems).toBeInstanceOf(Array);
      expect(res.body.problems.length).toBeGreaterThan(0);
    });

    it('should include required fields for each problem', async () => {
      const res = await request(app).get('/api/problems');

      const problem = res.body.problems[0];
      expect(problem.id).toBeDefined();
      expect(problem.title).toBeDefined();
      expect(problem.description).toBeDefined();
      expect(problem.requirements).toBeInstanceOf(Array);
      expect(problem.constraints).toBeInstanceOf(Array);
      expect(problem.difficulty).toBeDefined();
      expect(problem.tags).toBeInstanceOf(Array);
    });

    it('should filter by tag', async () => {
      const res = await request(app).get('/api/problems?tag=parking');

      expect(res.status).toBe(200);
      expect(res.body.problems.length).toBeGreaterThan(0);
      expect(res.body.problems.every((p) => p.tags.includes('parking'))).toBe(true);
    });
  });

  describe('GET /api/problems/:id', () => {
    it('should return a specific problem', async () => {
      const problemsRes = await request(app).get('/api/problems');
      const problemId = problemsRes.body.problems[0].id;

      const res = await request(app).get(`/api/problems/${problemId}`);

      expect(res.status).toBe(200);
      expect(res.body.problem.id).toBe(problemId);
    });

    it('should return 500 for unknown problem id', async () => {
      const res = await request(app).get('/api/problems/nonexistent');

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Problem not found');
    });
  });

  describe('POST /api/attempts', () => {
    it('should create a new attempt', async () => {
      const problemsRes = await request(app).get('/api/problems');
      const problemId = problemsRes.body.problems[0].id;

      const res = await request(app)
        .post('/api/attempts')
        .send({ problemId });

      expect(res.status).toBe(201);
      expect(res.body.attempt).toBeDefined();
      expect(res.body.attempt.learnerId).toBeDefined();
      expect(res.body.attempt.problemId).toBe(problemId);
    });

    it('should return error for unknown learner', async () => {
      const problemsRes = await request(app).get('/api/problems');
      const problemId = problemsRes.body.problems[0].id;

      const res = await request(app)
        .post('/api/attempts')
        .send({ learnerId: 'unknown', problemId });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Learner not found');
    });

    it('should return error for unknown problem', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .send({ problemId: 'nonexistent' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Problem not found');
    });

    it('should return error when problemId is missing', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .send({});

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('problemId is required');
    });
  });

  describe('PUT /api/attempts/:id/solution', () => {
    let attemptId;

    beforeEach(async () => {
      const problemsRes = await request(app).get('/api/problems');
      const res = await request(app)
        .post('/api/attempts')
        .send({ problemId: problemsRes.body.problems[0].id });
      attemptId = res.body.attempt.id;
    });

    it('should save a solution draft', async () => {
      const res = await request(app)
        .put(`/api/attempts/${attemptId}/solution`)
        .send({
          content: 'class ParkingLot { }',
          explanation: 'Simple design',
        });

      expect(res.status).toBe(200);
      expect(res.body.attempt.solution.content).toBe('class ParkingLot { }');
      expect(res.body.attempt.solution.explanation).toBe('Simple design');
    });

    it('should return error for empty content', async () => {
      const res = await request(app)
        .put(`/api/attempts/${attemptId}/solution`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('content is required');
    });
  });

  describe('POST /api/attempts/:id/submit', () => {
    let attemptId;

    beforeEach(async () => {
      const problemsRes = await request(app).get('/api/problems');
      const res = await request(app)
        .post('/api/attempts')
        .send({ problemId: problemsRes.body.problems[0].id });
      attemptId = res.body.attempt.id;

      await request(app)
        .put(`/api/attempts/${attemptId}/solution`)
        .send({
          content: 'class ParkingLot {}',
          explanation: 'test',
        });
    });

    it('should submit a draft', async () => {
      const res = await request(app).post(
        `/api/attempts/${attemptId}/submit`
      );

      expect(res.status).toBe(200);
      expect(res.body.attempt.status).toBe('FEEDBACK_PENDING');
      expect(res.body.attempt.submittedAt).not.toBeNull();
    });

    it('should return error when submitting without solution', async () => {
      const problemsRes = await request(app).get('/api/problems');
      const res = await request(app)
        .post('/api/attempts')
        .send({ problemId: problemsRes.body.problems[0].id });
      const emptyAttemptId = res.body.attempt.id;

      const submitRes = await request(app).post(
        `/api/attempts/${emptyAttemptId}/submit`
      );

      expect(submitRes.status).toBe(400);
      expect(submitRes.body.error).toContain('empty solution');
    });
  });

  describe('POST /api/attempts/:id/feedback', () => {
    let attemptId;

    beforeEach(async () => {
      const problemsRes = await request(app).get('/api/problems');
      const res = await request(app)
        .post('/api/attempts')
        .send({ problemId: problemsRes.body.problems[0].id });
      attemptId = res.body.attempt.id;

      await request(app)
        .put(`/api/attempts/${attemptId}/solution`)
        .send({
          content:
            'class ParkingLot class Floor class Vehicle class Ticket class RateCalculator',
          explanation:
            'Uses Strategy pattern and dependency injection. Trade-offs discussed.',
        });

      await request(app).post(`/api/attempts/${attemptId}/submit`);
    });

    it('should generate and return feedback', async () => {
      const res = await request(app).post(
        `/api/attempts/${attemptId}/feedback`
      );

      expect(res.status).toBe(200);
      expect(res.body.feedback).toBeDefined();
      expect(res.body.feedback.scores).toBeInstanceOf(Array);
      expect(res.body.feedback.scores.length).toBeGreaterThan(0);
      expect(res.body.feedback.overallScore).toBeDefined();
      expect(res.body.feedback.summary).toBeTruthy();
    });

    it('should return error when attempt not in PENDING status', async () => {
      const problemsRes = await request(app).get('/api/problems');
      const res = await request(app)
        .post('/api/attempts')
        .send({ problemId: problemsRes.body.problems[0].id });

      const feedbackRes = await request(app).post(
        `/api/attempts/${res.body.attempt.id}/feedback`
      );

      expect(feedbackRes.status).toBe(500);
      expect(feedbackRes.body.error).toContain('Cannot generate feedback');
    });
  });

  describe('GET /api/attempts', () => {
    it('should return attempt history for default learner', async () => {
      const res = await request(app).get('/api/attempts');

      expect(res.status).toBe(200);
      expect(res.body.attempts).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/learner/default', () => {
    it('should return the default learner', async () => {
      const res = await request(app).get('/api/learner/default');

      expect(res.status).toBe(200);
      expect(res.body.learner).toBeDefined();
      expect(res.body.learner.name).toBe('Default Learner');
      expect(res.body.learner.id).toBeDefined();
    });
  });

  describe('GET / (frontend)', () => {
    it('should serve the index page', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('LLD Practice Platform');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });
});
