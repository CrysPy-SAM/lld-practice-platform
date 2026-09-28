const FeedbackProvider = require('../../domain/interfaces/FeedbackProvider');
const {
  Feedback,
  CriterionScore,
} = require('../../domain/models/Feedback');
const {
  FeedbackCriteria,
  FeedbackProviderType,
} = require('../../domain/enums');

/**
 * Deterministic, rule-based feedback provider.
 * Analyzes the solution text against design principles using structural checks
 * and keyword/pattern matching. All checks are deterministic and reproducible.
 */
class RuleBasedFeedbackProvider extends FeedbackProvider {
  constructor() {
    super(FeedbackProviderType.RULE_BASED);
  }

  async provideFeedback(attempt, problem) {
    const solution = attempt.solution;
    if (!solution) {
      return this._emptyFeedback(attempt.id);
    }

    const content = solution.content || '';
    const explanation = solution.explanation || '';
    const fullText = (content + '\n' + explanation).toLowerCase();

    const scores = [];
    const suggestions = [];

    const scoreCriteria = [
      {
        criterion: FeedbackCriteria.MODULARITY,
        score: this._scoreModularity(fullText),
        comment: this._modularityComment(fullText),
      },
      {
        criterion: FeedbackCriteria.SOLID_PRINCIPLES,
        score: this._scoreSolidPrinciples(fullText),
        comment: this._solidComment(fullText),
      },
      {
        criterion: FeedbackCriteria.DESIGN_PATTERNS,
        score: this._scoreDesignPatterns(fullText),
        comment: this._patternsComment(fullText),
      },
      {
        criterion: FeedbackCriteria.RESPONSIBILITIES,
        score: this._scoreResponsibilities(fullText),
        comment: this._responsibilitiesComment(fullText),
      },
      {
        criterion: FeedbackCriteria.RELATIONSHIPS,
        score: this._scoreRelationships(fullText),
        comment: this._relationshipsComment(fullText),
      },
      {
        criterion: FeedbackCriteria.TRADEOFFS,
        score: this._scoreTradeoffs(explanation),
        comment: this._tradeoffsComment(explanation),
      },
      {
        criterion: FeedbackCriteria.COMPLETENESS,
        score: this._scoreCompleteness(content, problem),
        comment: this._completenessComment(content, problem),
      },
    ];

    for (const c of scoreCriteria) {
      scores.push(
        new CriterionScore({
          criterion: c.criterion,
          score: c.score,
          comment: c.comment,
        })
      );
    }

    if (scores.some((s) => s.score < 3)) {
      suggestions.push(
        'Consider breaking down classes with multiple responsibilities.',
        'Review SOLID principles, especially the Single Responsibility Principle.',
        'Ensure each class has a clear and focused purpose.'
      );
    }

    if (this._scoreDesignPatterns(fullText) < 2) {
      suggestions.push(
        'Identify opportunities where design patterns (e.g., Strategy, Factory) could simplify the design.'
      );
    }

    if (this._scoreModularity(fullText) < 3) {
      suggestions.push(
        'Group related functionality into cohesive classes or modules.'
      );
    }

    const summary = this._generateSummary(scores);

    return new Feedback({
      attemptId: attempt.id,
      providerType: this.type,
      scores,
      summary,
      suggestions: Array.from(new Set(suggestions)),
    });
  }

  _emptyFeedback(attemptId) {
    const scores = Object.values(FeedbackCriteria).map(
      (c) =>
        new CriterionScore({
          criterion: c,
          score: 0,
          comment: 'No solution provided.',
        })
    );

    return new Feedback({
      attemptId,
      providerType: this.type,
      scores,
      summary: 'No solution was submitted for evaluation.',
      suggestions: ['Please provide a solution before submitting.'],
    });
  }

  _scoreModularity(text) {
    const classDeclarations = (
      text.match(/class\s+\w+/g) ||
      text.match(/class\s+\w+/gi) ||
      []
    ).length;
    const methodDeclarations = (
      text.match(/(\b(public|private|protected)\s+)?\w+\s*\(.*?\)\s*\{/) ||
      text.match(/def\s+\w+/g) ||
      []
    ).length;

    if (classDeclarations >= 3 && methodDeclarations >= 5) return 5;
    if (classDeclarations >= 2 && methodDeclarations >= 3) return 4;
    if (classDeclarations >= 1 && methodDeclarations >= 2) return 3;
    if (classDeclarations >= 1) return 2;
    return 1;
  }

  _scoreSolidPrinciples(text) {
    let score = 1;
    if (text.includes('single responsibility')) score = 2;
    if (text.includes('open') && text.includes('closed')) score = 3;
    if (text.includes('lsp') || text.includes('liskov')) score = 3;
    if (
      text.includes('interface') ||
      text.includes('abstract')
    )
      score = Math.max(score, 3);
    if (
      text.includes('dependency injection') ||
      text.includes('inject')
    )
      score = 4;
    if (
      text.includes('single responsibility') &&
      (text.includes('interface') || text.includes('abstract')) &&
      (text.includes('dependency injection') || text.includes('inject'))
    )
      score = 5;
    return Math.max(score, this._scoreModularity(text) - 1);
  }

  _scoreDesignPatterns(text) {
    const patterns = [
      'strategy',
      'factory',
      'singleton',
      'observer',
      'command',
      'adapter',
      'decorator',
      'proxy',
      'facade',
      'builder',
      'state',
      'template',
      'composite',
      'bridge',
      'flyweight',
    ];

    const found = patterns.filter((p) => text.includes(p));
    if (found.length >= 2) return 5;
    if (found.length === 2) return 5;
    if (found.length === 1) return 3;
    return 1;
  }

  _scoreResponsibilities(text) {
    if (text.includes('cohesion') || text.includes('separation of concern'))
      return 5;
    if (text.includes('responsibility')) return 4;
    if (text.includes('single responsibility')) return 5;
    return this._scoreModularity(text) >= 3 ? 4 : 2;
  }

  _scoreRelationships(text) {
    const relationships = [
      'inheritance',
      'composition',
      'aggregation',
      'association',
      'interface',
    ];
    const found = relationships.filter((r) => text.includes(r));
    if (found.length >= 3) return 5;
    if (found.length >= 2) return 4;
    if (found.length >= 1) return 3;
    return 2;
  }

  _scoreTradeoffs(text) {
    if (!text || text.length < 20) return 1;
    if (
      text.includes('trade') ||
      text.includes('trade-off') ||
      text.includes('tradeoff') ||
      text.includes('compromise') ||
      text.includes('vs.') ||
      text.includes('versus')
    )
      return 5;
    if (text.includes('but ') || text.includes('however')) return 3;
    return 2;
  }

  _scoreCompleteness(content, problem) {
    if (!content || content.trim().length < 10) return 1;

    const requirements = problem.requirements || [];
    let score = 0;

    if (content.length > 200) score += 1;
    if (content.length > 500) score += 1;
    if (requirements.length > 0 && score >= 1) score += 1;
    if (content.toLowerCase().includes('diagram') || content.includes('->'))
      score += 1;

    return Math.min(score, 5);
  }

  _modularityComment(text) {
    const classCount = (text.match(/class\s+\w+/gi) || []).length;
    if (classCount >= 3) {
      return `Good modularity: ${classCount} distinct classes identified. Classes are well-separated.`;
    }
    if (classCount >= 2) {
      return `Moderate modularity: ${classCount} classes found. Consider further decomposition.`;
    }
    return `Low modularity: only ${classCount} class(es) detected. Break the problem into smaller, focused classes.`;
  }

  _solidComment(text) {
    const principles = [];
    if (text.includes('single responsibility'))
      principles.push('SRP');
    if (text.includes('open') && text.includes('closed'))
      principles.push('OCP');
    if (text.includes('liskov') || text.includes('lsp'))
      principles.push('LSP');
    if (text.includes('interface'))
      principles.push('ISP');
    if (text.includes('dependency'))
      principles.push('DIP');

    if (principles.length >= 4)
      return `Excellent SOLID application: ${principles.join(', ')} principles are addressed.`;
    if (principles.length >= 2)
      return `Good SOLID awareness: ${principles.join(', ')} are mentioned. Consider expanding to all five.`;
    if (principles.length >= 1)
      return `${principles.join(', ')} principle is mentioned. Review the remaining SOLID principles.`;
    return 'SOLID principles not explicitly addressed. Review Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.';
  }

  _patternsComment(text) {
    const patterns = [
      'strategy',
      'factory',
      'singleton',
      'observer',
      'command',
      'adapter',
      'decorator',
      'proxy',
      'facade',
      'builder',
      'state',
      'template',
      'composite',
      'bridge',
      'flyweight',
    ];
    const found = patterns.filter((p) => text.includes(p));
    if (found.length >= 2) {
      return `Good pattern usage: ${found.join(', ')} patterns identified. Appropriate for the problem context.`;
    }
    if (found.length === 1) {
      return `${found.join(', ')} pattern is identified. Consider other patterns that may fit.`;
    }
    return 'No design patterns explicitly identified. Review common patterns (Strategy, Factory, Observer, etc.) that could apply.';
  }

  _responsibilitiesComment(text) {
    if (text.includes('single responsibility') || text.includes('separation of concern'))
      return 'Responsibilities are well-separated across classes.';
    if (text.includes('responsibility'))
      return 'Responsibilities are considered. Ensure each class has a single responsibility.';
    return 'Consider defining clear responsibilities for each class. Review the Single Responsibility Principle.';
  }

  _relationshipsComment(text) {
    const found = [];
    if (text.includes('inheritance')) found.push('inheritance');
    if (text.includes('composition')) found.push('composition');
    if (text.includes('aggregation')) found.push('aggregation');
    if (text.includes('association')) found.push('association');
    if (text.includes('interface')) found.push('interface');

    if (found.length >= 3)
      return `Good relationship modeling: ${found.join(', ')} are used appropriately.`;
    if (found.length >= 1)
      return `${found.join(', ')} are mentioned. Consider other UML relationships (composition, aggregation, association).`;
    return 'Relationships between classes are not clearly defined. Consider inheritance, composition, aggregation, and association.';
  }

  _tradeoffsComment(text) {
    if (
      text.includes('trade') ||
      text.includes('compromise') ||
      text.includes('vs.') ||
      text.includes('versus')
    )
      return 'Trade-offs are well-analyzed and documented.';
    if (text && text.length > 20)
      return 'Consider documenting explicit trade-offs and alternatives considered.';
    return 'No trade-off analysis found. Consider discussing design alternatives and their implications.';
  }

  _completenessComment(content, problem) {
    const requirements = problem.requirements || [];
    if (!content || content.trim().length < 10)
      return 'Solution is incomplete or empty. Please provide a full design.';
    if (requirements.length === 0) return 'Solution meets basic requirements.';
    return `Solution should address all ${requirements.length} requirements of the problem.`;
  }

  _generateSummary(scores) {
    const overall = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    if (overall >= 4)
      return 'Strong design with good structure, pattern usage, and SOLID principles. Minor improvements possible.';
    if (overall >= 3)
      return 'Decent design with room for improvement in modularity and pattern usage.';
    if (overall >= 2)
      return 'The design addresses the problem but needs significant improvement in structure and principles.';
    return 'The solution is incomplete. Focus on breaking down the problem into classes and addressing requirements.';
  }
}

module.exports = RuleBasedFeedbackProvider;
