const ProblemRepository = require('../../domain/interfaces/ProblemRepository');
const LldProblem = require('../../domain/models/LldProblem');

/**
 * In-memory implementation of ProblemRepository.
 * Pre-seeded with a catalog of LLD problems for practice.
 */
class InMemoryProblemRepository extends ProblemRepository {
  constructor(problems) {
    super();
    this.problems = new Map();
    if (problems) {
      for (const problem of problems) {
        this.problems.set(problem.id, problem);
      }
    }
  }

  async findAll() {
    return Array.from(this.problems.values());
  }

  async findById(id) {
    return this.problems.get(id) || null;
  }

  async findByTag(tag) {
    return Array.from(this.problems.values()).filter((p) =>
      p.tags.includes(tag)
    );
  }

  async save(problem) {
    this.problems.set(problem.id, problem);
    return problem;
  }
}

module.exports = InMemoryProblemRepository;
