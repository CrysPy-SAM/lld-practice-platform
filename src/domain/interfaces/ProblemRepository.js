/**
 * Interface for repositories that store LLD problems.
 */
class ProblemRepository {
  constructor() {
    if (this.constructor === ProblemRepository) {
      throw new Error('Abstract class "ProblemRepository" cannot be instantiated');
    }
  }

  async findAll() {
    throw new Error('Method "findAll" must be implemented');
  }

  async findById(id) {
    throw new Error('Method "findById" must be implemented');
  }

  async findByTag(tag) {
    throw new Error('Method "findByTag" must be implemented');
  }

  async save(problem) {
    throw new Error('Method "save" must be implemented');
  }
}

module.exports = ProblemRepository;
