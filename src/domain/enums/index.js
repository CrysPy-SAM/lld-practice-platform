const SubmissionStatus = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  FEEDBACK_PENDING: 'FEEDBACK_PENDING',
  FEEDBACK_READY: 'FEEDBACK_READY',
  FEEDBACK_FAILED: 'FEEDBACK_FAILED',
});

const SolutionFormat = Object.freeze({
  TEXT: 'TEXT',
  CODE: 'CODE',
  DIAGRAM: 'DIAGRAM',
  MIXED: 'MIXED',
});

const FeedbackCriteria = Object.freeze({
  MODULARITY: 'MODULARITY',
  SOLID_PRINCIPLES: 'SOLID_PRINCIPLES',
  DESIGN_PATTERNS: 'DESIGN_PATTERNS',
  RESPONSIBILITIES: 'RESPONSIBILITIES',
  RELATIONSHIPS: 'RELATIONSHIPS',
  TRADEOFFS: 'TRADEOFFS',
  COMPLETENESS: 'COMPLETENESS',
});

const FeedbackProviderType = Object.freeze({
  RULE_BASED: 'RULE_BASED',
  LLM: 'LLM',
});

module.exports = {
  SubmissionStatus,
  SolutionFormat,
  FeedbackCriteria,
  FeedbackProviderType,
};
