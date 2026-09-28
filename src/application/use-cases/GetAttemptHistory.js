/**
 * Use case: Get attempt history for a learner.
 */
class GetAttemptHistory {
  constructor({ practiceService }) {
    this.practiceService = practiceService;
  }

  async execute({ learnerId, problemId } = {}) {
    if (!learnerId) {
      throw new Error('learnerId is required');
    }

    return await this.practiceService.getAttemptHistory(learnerId, {
      problemId,
    });
  }
}

module.exports = GetAttemptHistory;
