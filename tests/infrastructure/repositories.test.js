const InMemoryProblemRepository = require('../../src/infrastructure/repositories/InMemoryProblemRepository');
const InMemoryAttemptRepository = require('../../src/infrastructure/repositories/InMemoryAttemptRepository');
const InMemoryLearnerRepository = require('../../src/infrastructure/repositories/InMemoryLearnerRepository');
const LldProblem = require('../../src/domain/models/LldProblem');
const Learner = require('../../src/domain/models/Learner');
const Attempt = require('../../src/domain/models/Attempt');
const { SubmissionStatus } = require('../../src/domain/enums');

describe('InMemoryProblemRepository', () => {
  let repo;
  let prob1, prob2;

  beforeEach(() => {
    prob1 = new LldProblem({ id: 'p1', title: 'Parking', tags: ['parking'], difficulty: 'medium' });
    prob2 = new LldProblem({ id: 'p2', title: 'Elevator', tags: ['elevator'], difficulty: 'hard' });
    repo = new InMemoryProblemRepository([prob1, prob2]);
  });

  it('should find all problems', async () => {
    const problems = await repo.findAll();
    expect(problems).toHaveLength(2);
  });

  it('should find a problem by id', async () => {
    const problem = await repo.findById('p1');
    expect(problem.id).toBe('p1');
  });

  it('should return null for unknown id', async () => {
    const problem = await repo.findById('unknown');
    expect(problem).toBeNull();
  });

  it('should find by tag', async () => {
    const problems = await repo.findByTag('parking');
    expect(problems).toHaveLength(1);
    expect(problems[0].id).toBe('p1');
  });

  it('should save a new problem', async () => {
    const newProb = new LldProblem({ id: 'p3', title: 'Cache' });
    await repo.save(newProb);
    const found = await repo.findById('p3');
    expect(found.id).toBe('p3');
  });
});

describe('InMemoryAttemptRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryAttemptRepository();
  });

  it('should save and find by id', async () => {
    const attempt = new Attempt({ learnerId: 'l1', problemId: 'p1' });
    await repo.save(attempt);

    const found = await repo.findById(attempt.id);
    expect(found.id).toBe(attempt.id);
  });

  it('should return null for unknown id', async () => {
    const found = await repo.findById('unknown');
    expect(found).toBeNull();
  });

  it('should find by learner', async () => {
    const a1 = new Attempt({ learnerId: 'l1', problemId: 'p1' });
    const a2 = new Attempt({ learnerId: 'l1', problemId: 'p2' });
    const a3 = new Attempt({ learnerId: 'l2', problemId: 'p1' });

    await repo.save(a1);
    await repo.save(a2);
    await repo.save(a3);

    const results = await repo.findByLearner('l1');
    expect(results).toHaveLength(2);
  });

  it('should find by learner and problem, sorted by startedAt desc', async () => {
    const a1 = new Attempt({
      learnerId: 'l1',
      problemId: 'p1',
      startedAt: new Date('2024-01-01'),
    });
    const a2 = new Attempt({
      learnerId: 'l1',
      problemId: 'p1',
      startedAt: new Date('2024-01-02'),
    });
    const a3 = new Attempt({
      learnerId: 'l1',
      problemId: 'p2',
      startedAt: new Date('2024-01-03'),
    });

    await repo.save(a1);
    await repo.save(a2);
    await repo.save(a3);

    const results = await repo.findByLearnerAndProblem('l1', 'p1');
    expect(results).toHaveLength(2);
    expect(results[0].startedAt).toEqual(new Date('2024-01-02'));
  });
});

describe('InMemoryLearnerRepository', () => {
  let repo;
  let learner1;

  beforeEach(() => {
    learner1 = new Learner({ name: 'Alice', email: 'alice@test.com' });
    repo = new InMemoryLearnerRepository([learner1]);
  });

  it('should find by id', async () => {
    const found = await repo.findById(learner1.id);
    expect(found.name).toBe('Alice');
  });

  it('should return null for unknown id', async () => {
    const found = await repo.findById('unknown');
    expect(found).toBeNull();
  });

  it('should find by email', async () => {
    const found = await repo.findByEmail('alice@test.com');
    expect(found.id).toBe(learner1.id);
  });

  it('should return null for unknown email', async () => {
    const found = await repo.findByEmail('unknown@test.com');
    expect(found).toBeNull();
  });

  it('should save a new learner', async () => {
    const newLearner = new Learner({ name: 'Bob', email: 'bob@test.com' });
    await repo.save(newLearner);
    const found = await repo.findById(newLearner.id);
    expect(found.name).toBe('Bob');
  });
});
