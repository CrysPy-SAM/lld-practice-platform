const {
  SubmissionStatus,
  FeedbackProviderType,
} = require('../../domain/enums');
const {
  Feedback,
  CriterionScore,
} = require('../../domain/models/Feedback');

/**
 * Service for generating feedback on submitted solutions.
 * Orchestrates feedback providers and handles async/failure scenarios.
 */
class FeedbackService {
  constructor({ attemptRepository, problemRepository, feedbackProviders }) {
    this.attemptRepository = attemptRepository;
    this.problemRepository = problemRepository;
    this.feedbackProviders = feedbackProviders || {
      rule: null,
      llm: null,
    };
  }

  /**
   * Generates feedback for a submitted attempt.
   * Combines deterministic (rule-based) and LLM-based feedback when available.
   */
  async generateFeedback(attemptId) {
    const attempt = await this.attemptRepository.findById(attemptId);

    if (!attempt) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }

    if (attempt.status !== SubmissionStatus.FEEDBACK_PENDING) {
      throw new Error(
        `Cannot generate feedback: attempt is in ${attempt.status} status`
      );
    }

    try {
      const problem = await this._getProblem(attempt.problemId);

      const feedbacks = [];
      const providerErrors = [];

      if (this.feedbackProviders.rule) {
        try {
          const ruleFeedback = await this.feedbackProviders.rule.provideFeedback(
            attempt,
            problem
          );
          if (ruleFeedback) feedbacks.push(ruleFeedback);
        } catch (error) {
          providerErrors.push({ provider: 'rule', error: error.message });
        }
      }

      if (this.feedbackProviders.llm) {
        try {
          const llmFeedback = await this.feedbackProviders.llm.provideFeedback(
            attempt,
            problem
          );
          if (llmFeedback) feedbacks.push(llmFeedback);
        } catch (error) {
          providerErrors.push({ provider: 'llm', error: error.message });
        }
      }

      if (feedbacks.length === 0) {
        throw new Error(
          `All feedback providers failed: ${JSON.stringify(providerErrors)}`
        );
      }

      const mergedFeedback = this._mergeFeedbacks(feedbacks, attemptId);
      attempt.markFeedbackReady(mergedFeedback);
      await this.attemptRepository.save(attempt);

      return mergedFeedback;
    } catch (error) {
      attempt.markFeedbackFailed();
      await this.attemptRepository.save(attempt);
      throw error;
    }
  }

  async _getProblem(problemId) {
    if (this.problemRepository) {
      const problem = await this.problemRepository.findById(problemId);
      if (!problem) {
        throw new Error(`Problem not found: ${problemId}`);
      }
      return problem;
    }
    return { id: problemId, title: 'Unknown', requirements: [] };
  }

  _mergeFeedbacks(feedbacks, attemptId) {
    const mergedScores = [];
    for (const fb of feedbacks) {
      mergedScores.push(...fb.scores);
    }

    const summaryParts = feedbacks
      .map((fb) => fb.summary)
      .filter((s) => s)
      .join('\n\n');

    const allSuggestions = [];
    for (const fb of feedbacks) {
      if (Array.isArray(fb.suggestions)) {
        allSuggestions.push(...fb.suggestions);
      }
    }

    const primaryProvider = feedbacks.find(
      (f) => f.providerType === FeedbackProviderType.RULE_BASED
    ) || feedbacks[0];

    const merged = new Feedback({
      attemptId,
      providerType: primaryProvider.providerType,
      scores: mergedScores,
      summary: summaryParts,
      suggestions: allSuggestions,
    });

    return merged;
  }
}

module.exports = FeedbackService;
