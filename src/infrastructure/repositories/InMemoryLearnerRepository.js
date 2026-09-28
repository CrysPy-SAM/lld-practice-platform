const LearnerRepository = require('../../domain/interfaces/LearnerRepository');

/**
 * In-memory implementation of LearnerRepository.
 */
class InMemoryLearnerRepository extends LearnerRepository {
  constructor(learners) {
    super();
    this.learners = new Map();
    if (learners) {
      for (const learner of learners) {
        this.learners.set(learner.id, learner);
      }
    }
  }

  async findById(id) {
    return this.learners.get(id) || null;
  }

  async findByEmail(email) {
    return (
      Array.from(this.learners.values()).find((l) => l.email === email) || null
    );
  }

  async save(learner) {
    this.learners.set(learner.id, learner);
    return learner;
  }
}

module.exports = InMemoryLearnerRepository;
