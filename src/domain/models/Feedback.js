const { randomUUID } = require('crypto');
const { FeedbackCriteria, FeedbackProviderType } = require('../enums');

class CriterionScore {
  constructor({ criterion, score, comment }) {
    if (!Object.values(FeedbackCriteria).includes(criterion)) {
      throw new Error(`Invalid feedback criterion: ${criterion}`);
    }
    if (score < 0 || score > 5) {
      throw new Error('Score must be between 0 and 5');
    }
    this.criterion = criterion;
    this.score = score;
    this.comment = comment || '';
  }

  toJSON() {
    return {
      criterion: this.criterion,
      score: this.score,
      comment: this.comment,
    };
  }
}

class Feedback {
  constructor({ id, attemptId, providerType, scores, summary, suggestions, processedAt }) {
    this.id = id || randomUUID();
    this.attemptId = attemptId;
    this.providerType = providerType || FeedbackProviderType.RULE_BASED;
    this.scores = scores || [];
    this.summary = summary || '';
    this.suggestions = suggestions || [];
    this.processedAt = processedAt || new Date();
  }

  get overallScore() {
    if (this.scores.length === 0) return 0;
    const total = this.scores.reduce((sum, s) => sum + s.score, 0);
    return Math.round((total / this.scores.length) * 10) / 10;
  }

  addScore(criterionScore) {
    this.scores.push(criterionScore);
  }

  toJSON() {
    return {
      id: this.id,
      attemptId: this.attemptId,
      providerType: this.providerType,
      scores: this.scores.map(s => s.toJSON()),
      overallScore: this.overallScore,
      summary: this.summary,
      suggestions: this.suggestions,
      processedAt: this.processedAt.toISOString(),
    };
  }
}

module.exports = { Feedback, CriterionScore };
