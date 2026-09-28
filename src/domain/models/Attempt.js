const { randomUUID } = require('crypto');
const { SubmissionStatus } = require('../enums');

class Attempt {
  constructor({ id, learnerId, problemId, solution, status, startedAt, submittedAt }) {
    this.id = id || randomUUID();
    this.learnerId = learnerId;
    this.problemId = problemId;
    this.solution = solution || null;
    this.status = status || SubmissionStatus.DRAFT;
    this.startedAt = startedAt || new Date();
    this.submittedAt = submittedAt || null;
    this.feedback = null;
  }

  setSolution(solution) {
    this.solution = solution;
    if (!this.solution) {
      this.status = SubmissionStatus.DRAFT;
    }
  }

  submit() {
    if (!this.solution || !this.solution.content.trim()) {
      throw new Error('Cannot submit an empty solution');
    }
    this.status = SubmissionStatus.FEEDBACK_PENDING;
    this.submittedAt = new Date();
  }

  markFeedbackReady(feedback) {
    this.feedback = feedback;
    this.status = SubmissionStatus.FEEDBACK_READY;
  }

  markFeedbackFailed() {
    this.status = SubmissionStatus.FEEDBACK_FAILED;
  }

  toJSON() {
    return {
      id: this.id,
      learnerId: this.learnerId,
      problemId: this.problemId,
      solution: this.solution ? this.solution.toJSON() : null,
      status: this.status,
      startedAt: this.startedAt.toISOString(),
      submittedAt: this.submittedAt ? this.submittedAt.toISOString() : null,
      feedback: this.feedback ? this.feedback.toJSON() : null,
    };
  }
}

module.exports = Attempt;
