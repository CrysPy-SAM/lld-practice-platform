const { Feedback, CriterionScore } = require('../../src/domain/models/Feedback');
const {
  FeedbackCriteria,
  FeedbackProviderType,
} = require('../../src/domain/enums');

describe('Feedback', () => {
  describe('construction', () => {
    it('should create a feedback with default values', () => {
      const feedback = new Feedback({ attemptId: 'att-1' });

      expect(feedback.attemptId).toBe('att-1');
      expect(feedback.providerType).toBe(FeedbackProviderType.RULE_BASED);
      expect(feedback.scores).toEqual([]);
      expect(feedback.processedAt).toBeInstanceOf(Date);
    });

    it('should generate a unique id', () => {
      const f1 = new Feedback({ attemptId: 'a' });
      const f2 = new Feedback({ attemptId: 'a' });
      expect(f1.id).not.toBe(f2.id);
    });
  });

  describe('overallScore', () => {
    it('should return 0 when no scores', () => {
      const feedback = new Feedback({ attemptId: 'a' });
      expect(feedback.overallScore).toBe(0);
    });

    it('should calculate average rounded to 1 decimal', () => {
      const feedback = new Feedback({ attemptId: 'a' });
      feedback.addScore(
        new CriterionScore({ criterion: FeedbackCriteria.MODULARITY, score: 5 })
      );
      feedback.addScore(
        new CriterionScore({ criterion: FeedbackCriteria.SOLID_PRINCIPLES, score: 3 })
      );
      feedback.addScore(
        new CriterionScore({ criterion: FeedbackCriteria.DESIGN_PATTERNS, score: 4 })
      );

      expect(feedback.overallScore).toBe(4);
    });
  });

  describe('addScore()', () => {
    it('should add a criterion score', () => {
      const feedback = new Feedback({ attemptId: 'a' });
      const cs = new CriterionScore({
        criterion: FeedbackCriteria.MODULARITY,
        score: 4,
        comment: 'Good',
      });

      feedback.addScore(cs);

      expect(feedback.scores).toHaveLength(1);
      expect(feedback.scores[0]).toBe(cs);
    });
  });

  describe('toJSON()', () => {
    it('should include overallScore in JSON', () => {
      const feedback = new Feedback({ attemptId: 'a' });
      feedback.addScore(
        new CriterionScore({ criterion: FeedbackCriteria.MODULARITY, score: 5 })
      );

      const json = feedback.toJSON();

      expect(json.attemptId).toBe('a');
      expect(json.overallScore).toBe(5);
      expect(json.scores).toHaveLength(1);
    });
  });
});

describe('CriterionScore', () => {
  it('should throw on invalid criterion', () => {
    expect(() => {
      new CriterionScore({ criterion: 'INVALID', score: 3 });
    }).toThrow('Invalid feedback criterion');
  });

  it('should throw on score out of range (< 0)', () => {
    expect(() => {
      new CriterionScore({ criterion: FeedbackCriteria.MODULARITY, score: -1 });
    }).toThrow('Score must be between 0 and 5');
  });

  it('should throw on score out of range (> 5)', () => {
    expect(() => {
      new CriterionScore({ criterion: FeedbackCriteria.MODULARITY, score: 6 });
    }).toThrow('Score must be between 0 and 5');
  });

  it('should allow boundary scores 0 and 5', () => {
    const c0 = new CriterionScore({
      criterion: FeedbackCriteria.MODULARITY,
      score: 0,
    });
    const c5 = new CriterionScore({
      criterion: FeedbackCriteria.MODULARITY,
      score: 5,
    });
    expect(c0.score).toBe(0);
    expect(c5.score).toBe(5);
  });
});
