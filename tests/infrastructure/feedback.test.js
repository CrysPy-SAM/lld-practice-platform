const RuleBasedFeedbackProvider = require('../../src/infrastructure/feedback/RuleBasedFeedbackProvider');
const LLMBasedFeedbackProvider = require('../../src/infrastructure/feedback/LLMBasedFeedbackProvider');
const FeedbackProviderChain = require('../../src/infrastructure/feedback/FeedbackProviderChain');
const { SubmissionStatus } = require('../../src/domain/enums');
const { FeedbackProviderType } = require('../../src/domain/enums');
const Attempt = require('../../src/domain/models/Attempt');
const Solution = require('../../src/domain/models/Solution');
const { SolutionFormat } = require('../../src/domain/enums');
const LldProblem = require('../../src/domain/models/LldProblem');
const problemCatalog = require('../../src/infrastructure/problems/problemCatalog');

describe('RuleBasedFeedbackProvider', () => {
  let provider;
  let problem;

  beforeEach(() => {
    provider = new RuleBasedFeedbackProvider();
    problem = problemCatalog[0];
  });

  it('should provide feedback for a well-written solution', async () => {
    const attempt = new Attempt({
      learnerId: 'l1',
      problemId: problem.id,
      status: SubmissionStatus.FEEDBACK_PENDING,
    });

    const goodSolution = `
      class ParkingLot {
        // Manages floors and parking spots
        // Follows Single Responsibility Principle
      }
      class Floor { /* manages spots */ }
      class ParkingSpot { /* base class */ }
      class Vehicle { /* base class */ }
      class Ticket { /* issued on entry */ }
      class RateCalculator { /* uses Strategy pattern */ }
      class ParkingAttendant { /* handles entry/exit */ }

      This design uses inheritance, composition, and the Strategy pattern.
      Trade-offs: We chose composition over inheritance for flexibility.
      However, this adds complexity to the initial setup.
    `;

    attempt.setSolution(
      new Solution({
        content: goodSolution,
        format: SolutionFormat.TEXT,
        explanation:
          'I used Single Responsibility, the Strategy pattern, composition, and association for relationships. Trade-offs: simplicity vs flexibility.',
      })
    );

    const feedback = await provider.provideFeedback(attempt, problem);

    expect(feedback).toBeDefined();
    expect(feedback.attemptId).toBe(attempt.id);
    expect(feedback.providerType).toBe(FeedbackProviderType.RULE_BASED);
    expect(feedback.scores.length).toBe(7);
    expect(feedback.overallScore).toBeGreaterThanOrEqual(3);
    expect(feedback.summary).toBeTruthy();
  });

  it('should return empty feedback when no solution', async () => {
    const attempt = new Attempt({
      learnerId: 'l1',
      problemId: problem.id,
    });

    const feedback = await provider.provideFeedback(attempt, problem);

    expect(feedback.scores.length).toBe(7);
    expect(feedback.scores.every((s) => s.score === 0)).toBe(true);
    expect(feedback.summary).toContain('No solution');
  });

  it('should score low for a minimal solution', async () => {
    const attempt = new Attempt({
      learnerId: 'l1',
      problemId: problem.id,
      status: SubmissionStatus.FEEDBACK_PENDING,
    });
    attempt.setSolution(
      new Solution({ content: 'Just a parking lot class', format: SolutionFormat.TEXT })
    );

    const feedback = await provider.provideFeedback(attempt, problem);

    const modularityScore = feedback.scores.find(
      (s) => s.criterion === 'MODULARITY'
    );
    expect(modularityScore.score).toBeLessThanOrEqual(2);
  });

  it('should provide suggestions for weak designs', async () => {
    const attempt = new Attempt({
      learnerId: 'l1',
      problemId: problem.id,
      status: SubmissionStatus.FEEDBACK_PENDING,
    });
    attempt.setSolution(
      new Solution({ content: 'minimal', format: SolutionFormat.TEXT })
    );

    const feedback = await provider.provideFeedback(attempt, problem);

    expect(feedback.suggestions.length).toBeGreaterThan(0);
  });
});

describe('LLMBasedFeedbackProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new LLMBasedFeedbackProvider({ apiKey: null });
  });

  it('should simulate LLM feedback without API key', async () => {
    const problem = problemCatalog[0];
    const attempt = new Attempt({
      learnerId: 'l1',
      problemId: problem.id,
      status: SubmissionStatus.FEEDBACK_PENDING,
    });
    attempt.setSolution(
      new Solution({
        content:
          'class ParkingLot class ParkingSpot class Vehicle class Ticket',
        format: SolutionFormat.TEXT,
        explanation: 'Uses composition and dependency injection',
      })
    );

    const feedback = await provider.provideFeedback(attempt, problem);

    expect(feedback).toBeDefined();
    expect(feedback.providerType).toBe(FeedbackProviderType.LLM);
    expect(feedback.scores.length).toBeGreaterThan(0);
    expect(feedback.summary).toBeTruthy();
  });

  it('should return empty feedback when no solution', async () => {
    const attempt = new Attempt({
      learnerId: 'l1',
      problemId: 'p1',
    });

    const feedback = await provider.provideFeedback(attempt, {});

    expect(feedback.scores.every((s) => s.score === 0)).toBe(true);
  });
});

describe('FeedbackProviderChain', () => {
  it('should try providers in order and use first success', async () => {
    const mockProvider1 = {
      type: 'MOCK1',
      provideFeedback: jest.fn().mockResolvedValue({
        id: 'fb1',
        providerType: 'MOCK1',
        scores: [],
        summary: 'from provider 1',
        suggestions: [],
      }),
    };
    const mockProvider2 = {
      type: 'MOCK2',
      provideFeedback: jest.fn().mockResolvedValue({
        id: 'fb2',
        providerType: 'MOCK2',
        scores: [],
        summary: 'from provider 2',
        suggestions: [],
      }),
    };

    const chain = new FeedbackProviderChain([mockProvider1, mockProvider2]);
    const result = await chain.generateFeedback({}, {});

    expect(result.id).toBe('fb1');
    expect(mockProvider1.provideFeedback).toHaveBeenCalled();
    expect(mockProvider2.provideFeedback).not.toHaveBeenCalled();
  });

  it('should fall back to next provider if first fails', async () => {
    const mockProvider1 = {
      type: 'MOCK1',
      provideFeedback: jest.fn().mockRejectedValue(new Error('Provider 1 failed')),
    };
    const mockProvider2 = {
      type: 'MOCK2',
      provideFeedback: jest.fn().mockResolvedValue({
        id: 'fb2',
        providerType: 'MOCK2',
        scores: [],
        summary: 'from provider 2',
        suggestions: [],
      }),
    };

    const chain = new FeedbackProviderChain([mockProvider1, mockProvider2]);
    const result = await chain.generateFeedback({}, {});

    expect(result.id).toBe('fb2');
  });

  it('should throw if all providers fail', async () => {
    const mockProvider1 = {
      type: 'MOCK1',
      provideFeedback: jest.fn().mockRejectedValue(new Error('fail 1')),
    };
    const mockProvider2 = {
      type: 'MOCK2',
      provideFeedback: jest.fn().mockRejectedValue(new Error('fail 2')),
    };

    const chain = new FeedbackProviderChain([mockProvider1, mockProvider2]);

    await expect(chain.generateFeedback({}, {})).rejects.toThrow(
      'All feedback providers failed'
    );
  });

  it('should allow adding providers dynamically', () => {
    const chain = new FeedbackProviderChain([]);
    const provider = { type: 'MOCK', provideFeedback: jest.fn() };

    chain.addProvider(provider);

    expect(chain.getProviders()).toHaveLength(1);
    expect(chain.getProviders()[0]).toBe(provider);
  });
});
