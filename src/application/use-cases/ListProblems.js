/**
 * Use case: List available problems.
 */
class ListProblems {
  constructor({ practiceService }) {
    this.practiceService = practiceService;
  }

  async execute({ tag } = {}) {
    return await this.practiceService.listProblems({ tag });
  }
}

module.exports = ListProblems;
