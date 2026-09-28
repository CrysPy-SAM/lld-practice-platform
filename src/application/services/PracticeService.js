const Attempt = require('../../domain/models/Attempt');
const Solution = require('../../domain/models/Solution');
const { SubmissionStatus } = require('../../domain/enums');

/**
 * Service for managing the practice lifecycle.
 * Handles problem listing, attempt creation, solution management, and submission.
 */
class PracticeService {
  constructor({ problemRepository, attemptRepository, learnerRepository }) {
    this.problemRepository = problemRepository;
    this.attemptRepository = attemptRepository;
    this.learnerRepository = learnerRepository;
  }

  async listProblems({ tag } = {}) {
    if (tag) {
      return await this.problemRepository.findByTag(tag);
    }
    return await this.problemRepository.findAll();
  }

  async getProblem(problemId) {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new Error(`Problem not found: ${problemId}`);
    }
    return problem;
  }

  async getLearner(learnerId) {
    const learner = await this.learnerRepository.findById(learnerId);
    if (!learner) {
      throw new Error(`Learner not found: ${learnerId}`);
    }
    return learner;
  }

  async startAttempt(learnerId, problemId) {
    await this.getLearner(learnerId);
    await this.getProblem(problemId);

    const attempt = new Attempt({
      learnerId,
      problemId,
      solution: null,
      status: SubmissionStatus.DRAFT,
    });

    await this.attemptRepository.save(attempt);
    return attempt;
  }

  async getAttempt(attemptId) {
    const attempt = await this.attemptRepository.findById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }
    return attempt;
  }

  async saveSolutionDraft(attemptId, { content, explanation, format }) {
    const attempt = await this.getAttempt(attemptId);

    if (attempt.status !== SubmissionStatus.DRAFT) {
      throw new Error(
        `Cannot save draft: attempt is in ${attempt.status} status`
      );
    }

    if (!content || !content.trim()) {
      throw new Error('Cannot save draft: content is required');
    }

    const solution = attempt.solution
      ? attempt.solution
      : new Solution({});

    solution.updateContent(content);
    solution.updateExplanation(explanation);
    if (format) {
      solution.format = format;
    }

    attempt.setSolution(solution);
    await this.attemptRepository.save(attempt);
    return attempt;
  }

  async submitAttempt(attemptId) {
    const attempt = await this.getAttempt(attemptId);

    if (attempt.status !== SubmissionStatus.DRAFT) {
      throw new Error(
        `Cannot submit: attempt is in ${attempt.status} status`
      );
    }

    attempt.submit();
    await this.attemptRepository.save(attempt);
    return attempt;
  }

  async getAttemptHistory(learnerId, { problemId } = {}) {
    await this.getLearner(learnerId);

    if (problemId) {
      return await this.attemptRepository.findByLearnerAndProblem(
        learnerId,
        problemId
      );
    }

    return await this.attemptRepository.findByLearner(learnerId);
  }
}

module.exports = PracticeService;
