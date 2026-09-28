/**
 * Use case: Generate feedback for a submitted attempt.
 */
class GenerateFeedback {
  constructor({ feedbackService }) {
    this.feedbackService = feedbackService;
  }

  async execute({ attemptId }) {
    if (!attemptId) {
      throw new Error('attemptId is required');
    }

    return await this.feedbackService.generateFeedback(attemptId);
  }
}

module.exports = GenerateFeedback;
