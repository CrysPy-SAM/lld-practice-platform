/**
 * Interface for repositories that store learners.
 */
class LearnerRepository {
  constructor() {
    if (this.constructor === LearnerRepository) {
      throw new Error('Abstract class "LearnerRepository" cannot be instantiated');
    }
  }

  async findById(id) {
    throw new Error('Method "findById" must be implemented');
  }

  async findByEmail(email) {
    throw new Error('Method "findByEmail" must be implemented');
  }

  async save(learner) {
    throw new Error('Method "save" must be implemented');
  }
}

module.exports = LearnerRepository;
