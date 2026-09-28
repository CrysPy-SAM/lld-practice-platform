/**
 * Use case: Submit an attempt for feedback.
 */
class SubmitAttempt {
  constructor({ practiceService }) {
    this.practiceService = practiceService;
  }

  async execute({ attemptId }) {
    if (!attemptId) {
      throw new Error('attemptId is required');
    }

    const attempt = await this.practiceService.submitAttempt(attemptId);
    return attempt;
  }
}

module.exports = SubmitAttempt;
