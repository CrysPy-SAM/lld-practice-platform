const PracticeService = require('./application/services/PracticeService');
const FeedbackService = require('./application/services/FeedbackService');

const StartAttempt = require('./application/use-cases/StartAttempt');
const SaveSolutionDraft = require('./application/use-cases/SaveSolutionDraft');
const SubmitAttempt = require('./application/use-cases/SubmitAttempt');
const GenerateFeedback = require('./application/use-cases/GenerateFeedback');
const ListProblems = require('./application/use-cases/ListProblems');
const GetAttemptHistory = require('./application/use-cases/GetAttemptHistory');

const InMemoryProblemRepository = require('./infrastructure/repositories/InMemoryProblemRepository');
const InMemoryAttemptRepository = require('./infrastructure/repositories/InMemoryAttemptRepository');
const InMemoryLearnerRepository = require('./infrastructure/repositories/InMemoryLearnerRepository');

const RuleBasedFeedbackProvider = require('./infrastructure/feedback/RuleBasedFeedbackProvider');
const LLMBasedFeedbackProvider = require('./infrastructure/feedback/LLMBasedFeedbackProvider');
const FeedbackProviderChain = require('./infrastructure/feedback/FeedbackProviderChain');

const problemCatalog = require('./infrastructure/problems/problemCatalog');
const Learner = require('./domain/models/Learner');

/**
 * Composition Root / Dependency Injection Container.
 * Wires all dependencies together following the Dependency Inversion Principle.
 *
 * The domain layer defines interfaces; the infrastructure layer provides
 * concrete implementations. The application layer orchestrates use cases.
 */
class Container {
  constructor() {
    this._isInitialized = false;
  }

  initialize() {
    if (this._isInitialized) return this;

    const defaultLearner = new Learner({
      name: 'Default Learner',
      email: 'learner@example.com',
    });

    this.learnerRepository = new InMemoryLearnerRepository([
      defaultLearner,
    ]);
    this.defaultLearnerId = defaultLearner.id;

    this.problemRepository = new InMemoryProblemRepository(
      problemCatalog
    );
    this.attemptRepository = new InMemoryAttemptRepository();

    this.practiceService = new PracticeService({
      problemRepository: this.problemRepository,
      attemptRepository: this.attemptRepository,
      learnerRepository: this.learnerRepository,
    });

    const ruleBasedProvider = new RuleBasedFeedbackProvider();
    const llmProvider = new LLMBasedFeedbackProvider({
      apiKey: process.env.OPENAI_API_KEY || null,
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
    });

    this.feedbackProviderChain = new FeedbackProviderChain([
      ruleBasedProvider,
      llmProvider,
    ]);

    this.feedbackService = new FeedbackService({
      attemptRepository: this.attemptRepository,
      problemRepository: this.problemRepository,
      feedbackProviders: {
        rule: ruleBasedProvider,
        llm: llmProvider,
      },
    });

    this.useCases = {
      listProblems: new ListProblems({
        practiceService: this.practiceService,
      }),
      startAttempt: new StartAttempt({
        practiceService: this.practiceService,
      }),
      saveSolutionDraft: new SaveSolutionDraft({
        practiceService: this.practiceService,
      }),
      submitAttempt: new SubmitAttempt({
        practiceService: this.practiceService,
      }),
      generateFeedback: new GenerateFeedback({
        feedbackService: this.feedbackService,
      }),
      getAttemptHistory: new GetAttemptHistory({
        practiceService: this.practiceService,
      }),
    };

    this._isInitialized = true;
    return this;
  }

  get defaultLearnerId() {
    if (!this._isInitialized) this.initialize();
    return this._defaultLearnerId;
  }

  set defaultLearnerId(value) {
    this._defaultLearnerId = value;
  }
}

const container = new Container();
container.initialize();

module.exports = container;
