const { randomUUID } = require('crypto');
const { SolutionFormat } = require('../enums');

class Solution {
  constructor({ id, content, format, explanation }) {
    this.id = id || randomUUID();
    this.content = content;
    this.format = format || SolutionFormat.TEXT;
    this.explanation = explanation || '';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  updateContent(content) {
    this.content = content;
    this.updatedAt = new Date();
  }

  updateExplanation(explanation) {
    this.explanation = explanation;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      format: this.format,
      explanation: this.explanation,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

module.exports = Solution;
