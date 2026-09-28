const Attempt = require('../../src/domain/models/Attempt');
const { SubmissionStatus } = require('../../src/domain/enums');

describe('Attempt', () => {
  describe('construction', () => {
    it('should create an attempt with draft status by default', () => {
      const attempt = new Attempt({
        learnerId: 'learner-1',
        problemId: 'problem-1',
      });
      expect(attempt.status).toBe(SubmissionStatus.DRAFT);
      expect(attempt.learnerId).toBe('learner-1');
      expect(attempt.problemId).toBe('problem-1');
      expect(attempt.solution).toBeNull();
      expect(attempt.submittedAt).toBeNull();
    });

    it('should generate a unique id', () => {
      const a1 = new Attempt({ learnerId: 'l', problemId: 'p' });
      const a2 = new Attempt({ learnerId: 'l', problemId: 'p' });
      expect(a1.id).not.toBe(a2.id);
    });
  });

  describe('submit()', () => {
    it('should transition to FEEDBACK_PENDING and set submittedAt', () => {
      const Solution = require('../../src/domain/models/Solution');
      const attempt = new Attempt({
        learnerId: 'l-1',
        problemId: 'p-1',
      });
      attempt.setSolution(
        new Solution({ content: 'My solution', format: 'TEXT' })
      );

      attempt.submit();

      expect(attempt.status).toBe(SubmissionStatus.FEEDBACK_PENDING);
      expect(attempt.submittedAt).not.toBeNull();
    });

    it('should throw when submitting an empty solution', () => {
      const attempt = new Attempt({
        learnerId: 'l-1',
        problemId: 'p-1',
      });
      attempt.setSolution(
        new (require('../../src/domain/models/Solution'))({ content: '' })
      );

      expect(() => attempt.submit()).toThrow(
        'Cannot submit an empty solution'
      );
    });

    it('should throw when submitting without a solution', () => {
      const attempt = new Attempt({
        learnerId: 'l-1',
        problemId: 'p-1',
      });

      expect(() => attempt.submit()).toThrow(
        'Cannot submit an empty solution'
      );
    });
  });

  describe('markFeedbackReady()', () => {
    it('should set status to FEEDBACK_READY and store feedback', () => {
      const attempt = new Attempt({
        learnerId: 'l',
        problemId: 'p',
      });
      const fakeFeedback = { id: 'fb-1', toJSON: () => ({ id: 'fb-1' }) };

      attempt.markFeedbackReady(fakeFeedback);

      expect(attempt.status).toBe(SubmissionStatus.FEEDBACK_READY);
      expect(attempt.feedback).toBe(fakeFeedback);
    });
  });

  describe('markFeedbackFailed()', () => {
    it('should set status to FEEDBACK_FAILED', () => {
      const attempt = new Attempt({
        learnerId: 'l',
        problemId: 'p',
      });

      attempt.markFeedbackFailed();

      expect(attempt.status).toBe(SubmissionStatus.FEEDBACK_FAILED);
    });
  });

  describe('setSolution()', () => {
    it('should set the solution', () => {
      const attempt = new Attempt({
        learnerId: 'l',
        problemId: 'p',
      });
      const Solution = require('../../src/domain/models/Solution');
      const solution = new Solution({ content: 'test' });

      attempt.setSolution(solution);

      expect(attempt.solution).toBe(solution);
    });

    it('should reset status to DRAFT when solution is null', () => {
      const attempt = new Attempt({
        learnerId: 'l',
        problemId: 'p',
        status: SubmissionStatus.FEEDBACK_PENDING,
      });
      attempt.setSolution(null);

      expect(attempt.status).toBe(SubmissionStatus.DRAFT);
    });
  });

  describe('toJSON()', () => {
    it('should serialize all fields', () => {
      const attempt = new Attempt({
        id: 'custom-id',
        learnerId: 'l-1',
        problemId: 'p-1',
        startedAt: new Date('2024-01-01'),
      });

      const json = attempt.toJSON();

      expect(json.id).toBe('custom-id');
      expect(json.learnerId).toBe('l-1');
      expect(json.problemId).toBe('p-1');
      expect(json.status).toBe(SubmissionStatus.DRAFT);
      expect(json.submittedAt).toBeNull();
    });
  });
});
