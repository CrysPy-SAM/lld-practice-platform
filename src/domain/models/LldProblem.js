const { randomUUID } = require('crypto');

class LldProblem {
  constructor({
    id,
    title,
    description,
    requirements,
    constraints,
    hints,
    difficulty,
    tags,
  }) {
    this.id = id || randomUUID();
    this.title = title;
    this.description = description;
    this.requirements = requirements || [];
    this.constraints = constraints || [];
    this.hints = hints || [];
    this.difficulty = difficulty;
    this.tags = tags || [];
    this.createdAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      requirements: this.requirements,
      constraints: this.constraints,
      hints: this.hints,
      difficulty: this.difficulty,
      tags: this.tags,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

module.exports = LldProblem;
