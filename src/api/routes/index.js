const express = require('express');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const container = require('../../container');

function createRouter() {
  const router = express.Router();
  const { useCases, defaultLearnerId } = container;

  router.get('/problems', async (req, res, next) => {
    try {
      const { tag } = req.query;
      const problems = await useCases.listProblems.execute({ tag });
      res.json({
        problems: problems.map((p) => p.toJSON()),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/problems/:id', async (req, res, next) => {
    try {
      const problem = await container.practiceService.getProblem(
        req.params.id
      );
      res.json({ problem: problem.toJSON() });
    } catch (err) {
      next(err);
    }
  });

  router.post('/attempts', async (req, res, next) => {
    try {
      const { learnerId, problemId } = req.body;

      const attempt = await useCases.startAttempt.execute({
        learnerId: learnerId || defaultLearnerId,
        problemId,
      });

      res.status(201).json({ attempt: attempt.toJSON() });
    } catch (err) {
      next(err);
    }
  });

  router.get('/attempts/:id', async (req, res, next) => {
    try {
      const attempt = await container.practiceService.getAttempt(
        req.params.id
      );
      res.json({ attempt: attempt.toJSON() });
    } catch (err) {
      next(err);
    }
  });

  router.put('/attempts/:id/solution', async (req, res, next) => {
    try {
      const { content, explanation, format } = req.body;

      const attempt = await useCases.saveSolutionDraft.execute({
        attemptId: req.params.id,
        content,
        explanation,
        format,
      });

      res.json({ attempt: attempt.toJSON() });
    } catch (err) {
      if (
        err.message.includes('Cannot') ||
        err.message.includes('is required') ||
        err.message.includes('Attempt not found')
      ) {
        err.statusCode = 400;
      }
      next(err);
    }
  });

  router.post('/attempts/:id/submit', async (req, res, next) => {
    try {
      const attempt = await useCases.submitAttempt.execute({
        attemptId: req.params.id,
      });
      res.json({ attempt: attempt.toJSON() });
    } catch (err) {
      err.statusCode = 400;
      next(err);
    }
  });

  router.post('/attempts/:id/feedback', async (req, res, next) => {
    try {
      const feedback = await useCases.generateFeedback.execute({
        attemptId: req.params.id,
      });
      res.json({ feedback: feedback.toJSON() });
    } catch (err) {
      next(err);
    }
  });

  router.get('/attempts', async (req, res, next) => {
    try {
      const { learnerId, problemId } = req.query;

      const attempts = await useCases.getAttemptHistory.execute({
        learnerId: learnerId || defaultLearnerId,
        problemId,
      });

      res.json({
        attempts: attempts.map((a) => a.toJSON()),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/learner/default', async (req, res) => {
    const learner = await container.learnerRepository.findById(
      defaultLearnerId
    );
    res.json({ learner: learner.toJSON() });
  });

  return router;
}

module.exports = { createRouter, errorHandler, notFoundHandler };
