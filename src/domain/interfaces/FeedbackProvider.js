/**
 * Interface for feedback providers.
 * Uses the Strategy pattern: different implementations provide feedback
 * via deterministic rules or LLM-based analysis.
 */
class FeedbackProvider {
  constructor(type) {
    if (this.constructor === FeedbackProvider) {
      throw new Error('Abstract class "FeedbackProvider" cannot be instantiated');
    }
    this.type = type;
  }

  /**
   * Provides feedback for a given attempt.
   * @param {object} attempt - The Attempt domain object
   * @param {object} problem - The LldProblem domain object
   * @returns {Promise<object>} - A Feedback domain object
   */
  async provideFeedback(attempt, problem) {
    throw new Error('Method "provideFeedback" must be implemented');
  }
}

module.exports = FeedbackProvider;
