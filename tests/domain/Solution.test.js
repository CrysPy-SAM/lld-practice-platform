const Solution = require('../../src/domain/models/Solution');
const { SolutionFormat } = require('../../src/domain/enums');

describe('Solution', () => {
  describe('construction', () => {
    it('should create a solution with defaults', () => {
      const solution = new Solution({ content: 'My design' });

      expect(solution.content).toBe('My design');
      expect(solution.format).toBe(SolutionFormat.TEXT);
      expect(solution.explanation).toBe('');
      expect(solution.createdAt).toBeInstanceOf(Date);
      expect(solution.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept all fields', () => {
      const solution = new Solution({
        content: 'class ParkingLot {}',
        format: SolutionFormat.CODE,
        explanation: 'Uses factory pattern',
      });

      expect(solution.content).toBe('class ParkingLot {}');
      expect(solution.format).toBe(SolutionFormat.CODE);
      expect(solution.explanation).toBe('Uses factory pattern');
    });

    it('should generate a unique id', () => {
      const s1 = new Solution({ content: 'a' });
      const s2 = new Solution({ content: 'b' });
      expect(s1.id).not.toBe(s2.id);
    });
  });

  describe('updateContent()', () => {
    it('should update content and updatedAt', () => {
      const solution = new Solution({ content: 'old' });
      const oldUpdated = solution.updatedAt;

      solution.updateContent('new');

      expect(solution.content).toBe('new');
      expect(solution.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdated.getTime()
      );
    });
  });

  describe('updateExplanation()', () => {
    it('should update explanation and updatedAt', () => {
      const solution = new Solution({ content: 'test' });
      solution.updateExplanation('Added SRP');

      expect(solution.explanation).toBe('Added SRP');
    });
  });

  describe('toJSON()', () => {
    it('should serialize all fields', () => {
      const solution = new Solution({
        content: 'design',
        format: SolutionFormat.MIXED,
        explanation: 'trade-offs discussed',
      });

      const json = solution.toJSON();

      expect(json.content).toBe('design');
      expect(json.format).toBe(SolutionFormat.MIXED);
      expect(json.explanation).toBe('trade-offs discussed');
      expect(json.id).toBeDefined();
    });
  });
});
