/**
 * Use case: Save a solution draft.
 */
class SaveSolutionDraft {
  constructor({ practiceService }) {
    this.practiceService = practiceService;
  }

  async execute({ attemptId, content, explanation, format }) {
    if (!attemptId) {
      throw new Error('attemptId is required');
    }
    if (!content || !content.trim()) {
      throw new Error('content is required');
    }

    return await this.practiceService.saveSolutionDraft(attemptId, {
      content,
      explanation,
      format,
    });
  }
}

module.exports = SaveSolutionDraft;
