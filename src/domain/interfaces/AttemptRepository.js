/**
 * Interface for repositories that store learner attempts.
 */
class AttemptRepository {
  constructor() {
    if (this.constructor === AttemptRepository) {
      throw new Error('Abstract class "AttemptRepository" cannot be instantiated');
    }
  }

  async findById(id) {
    throw new Error('Method "findById" must be implemented');
  }

  async findByLearner(learnerId) {
    throw new Error('Method "findByLearner" must be implemented');
  }

  async findByLearnerAndProblem(learnerId, problemId) {
    throw new Error('Method "findByLearnerAndProblem" must be implemented');
  }

  async save(attempt) {
    throw new Error('Method "save" must be implemented');
  }
}

module.exports = AttemptRepository;
