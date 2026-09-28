/**
 * Use case: Start a new practice attempt.
 */
class StartAttempt {
  constructor({ practiceService }) {
    this.practiceService = practiceService;
  }

  async execute({ learnerId, problemId }) {
    if (!learnerId) {
      throw new Error('learnerId is required');
    }
    if (!problemId) {
      throw new Error('problemId is required');
    }

    return await this.practiceService.startAttempt(learnerId, problemId);
  }
}

module.exports = StartAttempt;
