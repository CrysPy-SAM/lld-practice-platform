const ProblemRepository = require('../../src/domain/interfaces/ProblemRepository');
const AttemptRepository = require('../../src/domain/interfaces/AttemptRepository');
const LearnerRepository = require('../../src/domain/interfaces/LearnerRepository');
const FeedbackProvider = require('../../src/domain/interfaces/FeedbackProvider');

describe('Domain Interfaces - Abstract Class Enforcement', () => {
  it('should not allow instantiating abstract ProblemRepository', () => {
    expect(() => new ProblemRepository()).toThrow(
      'Abstract class "ProblemRepository" cannot be instantiated'
    );
  });

  it('should not allow instantiating abstract AttemptRepository', () => {
    expect(() => new AttemptRepository()).toThrow(
      'Abstract class "AttemptRepository" cannot be instantiated'
    );
  });

  it('should not allow instantiating abstract LearnerRepository', () => {
    expect(() => new LearnerRepository()).toThrow(
      'Abstract class "LearnerRepository" cannot be instantiated'
    );
  });

  it('should not allow instantiating abstract FeedbackProvider', () => {
    expect(() => new FeedbackProvider()).toThrow(
      'Abstract class "FeedbackProvider" cannot be instantiated'
    );
  });

  it('should not allow calling unimplemented methods on ProblemRepository', async () => {
    class TestRepo extends ProblemRepository {}
    const repo = new TestRepo();

    await expect(repo.findAll()).rejects.toThrow(
      'Method "findAll" must be implemented'
    );
  });

  it('should not allow calling unimplemented methods on FeedbackProvider', async () => {
    class TestProvider extends FeedbackProvider {
      constructor() {
        super('TEST');
      }
    }
    const provider = new TestProvider();

    await expect(provider.provideFeedback({}, {})).rejects.toThrow(
      'Method "provideFeedback" must be implemented'
    );
  });
});
