const RuleBasedFeedbackProvider = require('./RuleBasedFeedbackProvider');
const LLMBasedFeedbackProvider = require('./LLMBasedFeedbackProvider');
const { FeedbackProviderType } = require('../../domain/enums');

/**
 * Chain of Responsibility pattern for feedback providers.
 * Tries the primary provider first, falls back to others if it fails.
 * This addresses the design question: "What should happen if evaluation
 * takes time or fails?" - we chain providers for graceful degradation.
 */
class FeedbackProviderChain {
  constructor(providers = []) {
    this.providers = providers;
  }

  addProvider(provider) {
    this.providers.push(provider);
  }

  async generateFeedback(attempt, problem) {
    const errors = [];

    for (const provider of this.providers) {
      try {
        const feedback = await provider.provideFeedback(attempt, problem);
        if (feedback) {
          return feedback;
        }
      } catch (error) {
        errors.push({
          provider: provider.type,
          error: error.message,
        });
      }
    }

    throw new Error(
      `All feedback providers failed: ${JSON.stringify(errors)}`
    );
  }

  getProviders() {
    return this.providers;
  }
}

module.exports = FeedbackProviderChain;
