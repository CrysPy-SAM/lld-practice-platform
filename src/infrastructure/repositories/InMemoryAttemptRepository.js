const AttemptRepository = require('../../domain/interfaces/AttemptRepository');

/**
 * In-memory implementation of AttemptRepository.
 */
class InMemoryAttemptRepository extends AttemptRepository {
  constructor() {
    super();
    this.attempts = new Map();
  }

  async findById(id) {
    return this.attempts.get(id) || null;
  }

  async findByLearner(learnerId) {
    return Array.from(this.attempts.values()).filter(
      (a) => a.learnerId === learnerId
    );
  }

  async findByLearnerAndProblem(learnerId, problemId) {
    return Array.from(this.attempts.values())
      .filter((a) => a.learnerId === learnerId && a.problemId === problemId)
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  async save(attempt) {
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }
}

module.exports = InMemoryAttemptRepository;
