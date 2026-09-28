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
 * LLM-based feedback provider (simulated).
 * In a production system, this would call an LLM API (e.g., ChatGPT, Claude)
 * to analyze the solution text and return structured feedback.
 *
 * For the prototype, this simulates LLM responses using a deterministic
 * template-based approach with randomized elements seeded by the content.
 * This demonstrates the architecture for plug-in LLM evaluation while keeping
 * the prototype self-contained and testable.
 */
class LLMBasedFeedbackProvider extends FeedbackProvider {
  constructor({ apiKey = null, model = 'gpt-4o-mini' } = {}) {
    super(FeedbackProviderType.LLM);
    this.apiKey = apiKey;
    this.model = model;
  }

  async provideFeedback(attempt, problem) {
    const solution = attempt.solution;
    if (!solution) {
      return this._emptyFeedback(attempt.id);
    }

    const content = solution.content || '';
    const explanation = solution.explanation || '';

    try {
      const llmResult = await this._callLLM(content, explanation, problem);

      const scores = [];
      const suggestions = [];

      if (llmResult.scores) {
        for (const [criterion, value] of Object.entries(llmResult.scores)) {
          if (Object.values(FeedbackCriteria).includes(criterion)) {
            scores.push(
              new CriterionScore({
                criterion,
                score: Math.max(0, Math.min(5, value)),
                comment: llmResult.comments
                  ? llmResult.comments[criterion] || ''
                  : '',
              })
            );
          }
        }
      }

      if (llmResult.suggestions) {
        suggestions.push(...llmResult.suggestions);
      }

      if (scores.length === 0) {
        for (const criterion of Object.values(FeedbackCriteria)) {
          scores.push(
            new CriterionScore({
              criterion,
              score: 3,
              comment: 'Evaluated by LLM',
            })
          );
        }
      }

      return new Feedback({
        attemptId: attempt.id,
        providerType: this.type,
        scores,
        summary: llmResult.summary || 'LLM feedback processed.',
        suggestions: Array.from(new Set(suggestions)),
      });
    } catch (error) {
      throw new Error(
        `LLM feedback generation failed: ${error.message}`
      );
    }
  }

  async _callLLM(content, explanation, problem) {
    if (this.apiKey) {
      return this._callRealLLM(content, explanation, problem);
    }
    return this._simulateLLM(content, explanation, problem);
  }

  async _callRealLLM(content, explanation, problem) {
    const prompt = this._buildPrompt(content, explanation, problem);

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert LLD (Low-Level Design) reviewer. Evaluate the following solution and return JSON with scores (0-5) for each criterion, a summary, and suggestions. Criteria: MODULARITY, SOLID_PRINCIPLES, DESIGN_PATTERNS, RESPONSIBILITIES, RELATIONSHIPS, TRADEOFFS, COMPLETENESS. Return valid JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `LLM API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    return JSON.parse(text.trim());
  }

  _buildPrompt(content, explanation, problem) {
    return `
Problem: ${problem.title}
Requirements: ${problem.requirements.join('\n')}
Constraints: ${problem.constraints.join('\n')}

Solution:
${content}

Explanation:
${explanation}

Evaluate this solution carefully.`;
  }

  _simulateLLM(content, explanation, problem) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const text = (content + ' ' + explanation).toLowerCase();

        const simulateScore = (keywords, baseScore, multiplier = 1) => {
          let score = baseScore;
          for (const kw of keywords) {
            if (text.includes(kw)) score += multiplier;
          }
          return Math.min(Math.max(Math.floor(score), 1), 5);
        };

        const result = {
          scores: {
            [FeedbackCriteria.MODULARITY]: simulateScore(
              ['class', 'module', 'separate'],
              2
            ),
            [FeedbackCriteria.SOLID_PRINCIPLES]: simulateScore(
              [
                'single responsibility',
                'open',
                'closed',
                'liskov',
                'interface segregation',
                'dependency',
              ],
              2
            ),
            [FeedbackCriteria.DESIGN_PATTERNS]: simulateScore(
              [
                'strategy',
                'factory',
                'singleton',
                'observer',
                'command',
                'adapter',
              ],
              1
            ),
            [FeedbackCriteria.RESPONSIBILITIES]: simulateScore(
              ['responsibility', 'cohesion', 'separation'],
              2
            ),
            [FeedbackCriteria.RELATIONSHIPS]: simulateScore(
              ['inheritance', 'composition', 'aggregation', 'association'],
              1
            ),
            [FeedbackCriteria.TRADEOFFS]: simulateScore(
              ['trade', 'compromise', 'alternative', 'however'],
              explanation.length > 50 ? 2 : 1
            ),
            [FeedbackCriteria.COMPLETENESS]: simulateScore(
              ['parking', 'floor', 'spot', 'vehicle', 'ticket', 'rate'],
              content.length > 300 ? 3 : 2
            ),
          },
          comments: {
            [FeedbackCriteria.MODULARITY]:
              'Classes are reasonably separated with clear boundaries.',
            [FeedbackCriteria.SOLID_PRINCIPLES]:
              'Some SOLID principles are applied, but could be more explicit.',
            [FeedbackCriteria.DESIGN_PATTERNS]:
              'Pattern usage is present but could be more intentional.',
            [FeedbackCriteria.RESPONSIBILITIES]:
              'Responsibilities are mostly well-defined per class.',
            [FeedbackCriteria.RELATIONSHIPS]:
              'Relationships between entities are modeled.',
            [FeedbackCriteria.TRADEOFFS]:
              'Some trade-offs are discussed in the explanation.',
            [FeedbackCriteria.COMPLETENESS]:
              'The solution addresses the core requirements.',
          },
          summary: `LLM evaluation of ${problem.title} solution:\n${
            text.length > 500
              ? 'The solution demonstrates a solid understanding of the problem. Classes are well-structured and key design patterns are applied.'
              : 'The solution addresses the core requirements. Consider expanding on design decisions and trade-offs.'
          }\n\n${
            text.includes('trade') || text.includes('however')
              ? 'Good consideration of trade-offs in the explanation.'
              : 'Consider discussing alternative approaches and their trade-offs.'
          }`,
          suggestions: [
            'Consider adding more explicit documentation of design decisions.',
            'Review the relationship between classes for proper encapsulation.',
            'Consider edge cases in your design.',
            'Document any trade-offs between alternative approaches.',
          ],
        };

        resolve(result);
      }, 500);
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
}

module.exports = LLMBasedFeedbackProvider;
