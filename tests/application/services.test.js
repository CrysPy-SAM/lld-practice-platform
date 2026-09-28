const PracticeService = require('../../src/application/services/PracticeService');
const FeedbackService = require('../../src/application/services/FeedbackService');
const InMemoryProblemRepository = require('../../src/infrastructure/repositories/InMemoryProblemRepository');
const InMemoryAttemptRepository = require('../../src/infrastructure/repositories/InMemoryAttemptRepository');
const InMemoryLearnerRepository = require('../../src/infrastructure/repositories/InMemoryLearnerRepository');
const RuleBasedFeedbackProvider = require('../../src/infrastructure/feedback/RuleBasedFeedbackProvider');
const LLMBasedFeedbackProvider = require('../../src/infrastructure/feedback/LLMBasedFeedbackProvider');
const problemCatalog = require('../../src/infrastructure/problems/problemCatalog');
const Learner = require('../../src/domain/models/Learner');
const Attempt = require('../../src/domain/models/Attempt');
const Solution = require('../../src/domain/models/Solution');
const { SolutionFormat, SubmissionStatus } = require('../../src/domain/enums');
const { CriterionScore } = require('../../src/domain/models/Feedback');

function createServices() {
  const problemRepo = new InMemoryProblemRepository(problemCatalog);
  const attemptRepo = new InMemoryAttemptRepository();
  const learnerRepo = new InMemoryLearnerRepository([
    new Learner({ name: 'Test User', email: 'test@test.com' }),
  ]);

  const practiceService = new PracticeService({
    problemRepository: problemRepo,
    attemptRepository: attemptRepo,
    learnerRepository: learnerRepo,
  });

  const feedbackService = new FeedbackService({
    attemptRepository: attemptRepo,
    problemRepository: problemRepo,
    feedbackProviders: {
      rule: new RuleBasedFeedbackProvider(),
      llm: new LLMBasedFeedbackProvider({ apiKey: null }),
    },
  });

  return {
    practiceService,
    feedbackService,
    problemRepo,
    attemptRepo,
    learnerRepo,
    defaultLearnerId: learnerRepo.learners.keys().next().value,
  };
}

describe('PracticeService', () => {
  let services;

  beforeEach(() => {
    services = createServices();
  });

  describe('listProblems()', () => {
    it('should return all problems', async () => {
      const problems = await services.practiceService.listProblems();
      expect(problems.length).toBeGreaterThan(0);
    });

    it('should filter by tag', async () => {
      const problems = await services.practiceService.listProblems({
        tag: 'parking',
      });
      expect(problems.length).toBeGreaterThan(0);
      expect(problems.every((p) => p.tags.includes('parking'))).toBe(true);
    });
  });

  describe('getProblem()', () => {
    it('should return a problem by id', async () => {
      const problem = await services.practiceService.getProblem(
        services.problemRepo.problems.keys().next().value
      );
      expect(problem).toBeDefined();
      expect(problem.title).toBeTruthy();
    });

    it('should throw for unknown problem id', async () => {
      await expect(
        services.practiceService.getProblem('nonexistent')
      ).rejects.toThrow('Problem not found');
    });
  });

  describe('startAttempt()', () => {
    it('should create a new attempt in DRAFT status', async () => {
      const problemId = problemCatalog[0].id;
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemId
      );

      expect(attempt).toBeDefined();
      expect(attempt.learnerId).toBe(services.defaultLearnerId);
      expect(attempt.problemId).toBe(problemId);
      expect(attempt.status).toBe(SubmissionStatus.DRAFT);
    });

    it('should throw for unknown learner', async () => {
      await expect(
        services.practiceService.startAttempt('unknown-learner', problemCatalog[0].id)
      ).rejects.toThrow('Learner not found');
    });

    it('should throw for unknown problem', async () => {
      await expect(
        services.practiceService.startAttempt(services.defaultLearnerId, 'unknown-problem')
      ).rejects.toThrow('Problem not found');
    });
  });

  describe('saveSolutionDraft()', () => {
    it('should save a solution draft', async () => {
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );

      const updated = await services.practiceService.saveSolutionDraft(
        attempt.id,
        {
          content: 'My design solution',
          explanation: 'Uses factory pattern',
          format: SolutionFormat.TEXT,
        }
      );

      expect(updated.solution.content).toBe('My design solution');
      expect(updated.solution.explanation).toBe('Uses factory pattern');
      expect(updated.solution.format).toBe(SolutionFormat.TEXT);
    });

    it('should throw when content is empty', async () => {
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );

      await expect(
        services.practiceService.saveSolutionDraft(attempt.id, { content: '' })
      ).rejects.toThrow('Cannot save draft: content is required');
    });
  });

  describe('submitAttempt()', () => {
    it('should submit a draft attempt', async () => {
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );
      await services.practiceService.saveSolutionDraft(attempt.id, {
        content: 'My solution',
        explanation: 'test',
      });

      const submitted = await services.practiceService.submitAttempt(attempt.id);

      expect(submitted.status).toBe(SubmissionStatus.FEEDBACK_PENDING);
      expect(submitted.submittedAt).not.toBeNull();
    });

    it('should throw when submitting an attempt without a solution', async () => {
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );

      await expect(
        services.practiceService.submitAttempt(attempt.id)
      ).rejects.toThrow('Cannot submit an empty solution');
    });

    it('should throw when resubmitting a submitted attempt', async () => {
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );
      await services.practiceService.saveSolutionDraft(attempt.id, {
        content: 'My solution',
      });
      await services.practiceService.submitAttempt(attempt.id);

      await expect(
        services.practiceService.submitAttempt(attempt.id)
      ).rejects.toThrow('Cannot submit');
    });
  });

  describe('getAttemptHistory()', () => {
    it('should return attempts for a learner', async () => {
      const problemId = problemCatalog[0].id;
      const a1 = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemId
      );
      const a2 = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[1].id
      );

      const history = await services.practiceService.getAttemptHistory(
        services.defaultLearnerId
      );

      expect(history).toHaveLength(2);
    });

    it('should filter attempts by problem', async () => {
      const problemId = problemCatalog[0].id;
      await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemId
      );
      await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[1].id
      );

      const history = await services.practiceService.getAttemptHistory(
        services.defaultLearnerId,
        { problemId }
      );

      expect(history).toHaveLength(1);
      expect(history[0].problemId).toBe(problemId);
    });

    it('should throw for unknown learner', async () => {
      await expect(
        services.practiceService.getAttemptHistory('unknown')
      ).rejects.toThrow('Learner not found');
    });
  });
});

describe('FeedbackService', () => {
  let services;

  beforeEach(() => {
    services = createServices();
  });

  describe('generateFeedback()', () => {
    it('should generate and merge feedback from both providers', async () => {
      const problemId = problemCatalog[0].id;
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemId
      );
      await services.practiceService.saveSolutionDraft(attempt.id, {
        content:
          'class ParkingLot class Floor class Vehicle class Ticket class RateCalculator',
        explanation:
          'Uses Strategy pattern and dependency injection. Trade-offs: simplicity vs flexibility.',
      });
      await services.practiceService.submitAttempt(attempt.id);

      const feedback = await services.feedbackService.generateFeedback(
        attempt.id
      );

      expect(feedback).toBeDefined();
      expect(feedback.attemptId).toBe(attempt.id);
      expect(feedback.scores.length).toBeGreaterThan(0);
      expect(feedback.summary).toBeTruthy();
    });

    it('should throw for non-existent attempt', async () => {
      await expect(
        services.feedbackService.generateFeedback('nonexistent')
      ).rejects.toThrow('Attempt not found');
    });

    it('should throw when attempt is not in PENDING status', async () => {
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );

      await expect(
        services.feedbackService.generateFeedback(attempt.id)
      ).rejects.toThrow('Cannot generate feedback');
    });

    it('should mark attempt as FEEDBACK_READY on success', async () => {
      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );
      await services.practiceService.saveSolutionDraft(attempt.id, {
        content: 'test solution',
        explanation: 'explanation',
      });
      await services.practiceService.submitAttempt(attempt.id);

      await services.feedbackService.generateFeedback(attempt.id);

      const updated = await services.attemptRepo.findById(attempt.id);
      expect(updated.status).toBe(SubmissionStatus.FEEDBACK_READY);
      expect(updated.feedback).not.toBeNull();
    });

    it('should mark attempt as FEEDBACK_FAILED when all providers fail', async () => {
      const failingService = new FeedbackService({
        attemptRepository: services.attemptRepo,
        problemRepository: services.problemRepo,
        feedbackProviders: {
          rule: {
            type: 'FAIL',
            provideFeedback: jest.fn().mockRejectedValue(new Error('Boom')),
          },
          llm: {
            type: 'FAIL',
            provideFeedback: jest.fn().mockRejectedValue(new Error('Boom')),
          },
        },
      });

      const attempt = await services.practiceService.startAttempt(
        services.defaultLearnerId,
        problemCatalog[0].id
      );
      await services.practiceService.saveSolutionDraft(attempt.id, {
        content: 'test',
      });
      await services.practiceService.submitAttempt(attempt.id);

      await expect(
        failingService.generateFeedback(attempt.id)
      ).rejects.toThrow('All feedback providers failed');

      const updated = await services.attemptRepo.findById(attempt.id);
      expect(updated.status).toBe(SubmissionStatus.FEEDBACK_FAILED);
    });
  });
});
