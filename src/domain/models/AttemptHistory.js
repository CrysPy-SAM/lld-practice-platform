class AttemptHistory {
  constructor({ learnerId, entries }) {
    this.learnerId = learnerId;
    this.entries = entries || [];
  }

  addAttempt(attempt) {
    this.entries.push(attempt);
  }

  getAttemptsForProblem(problemId) {
    return this.entries.filter(a => a.problemId === problemId);
  }

  getLatestAttempt(problemId) {
    const attempts = this.getAttemptsForProblem(problemId);
    if (attempts.length === 0) return null;
    return attempts[attempts.length - 1];
  }

  get allAttempts() {
    return [...this.entries].sort((a, b) => b.startedAt - a.startedAt);
  }

  toJSON() {
    return {
      learnerId: this.learnerId,
      entries: this.entries.map(a => a.toJSON()),
    };
  }
}

module.exports = AttemptHistory;
