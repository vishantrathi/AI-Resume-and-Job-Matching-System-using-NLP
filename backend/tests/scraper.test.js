const { generateFallbackJobs } = require('../utils/scraper');

describe('Scraper Utility', () => {
  describe('generateFallbackJobs', () => {
    it('should return empty array when no skills provided', () => {
      const result = generateFallbackJobs([]);
      expect(result).toEqual([]);
    });

    it('should generate jobs when skills are provided', () => {
      const skills = ['JavaScript', 'React', 'Node.js'];
      const result = generateFallbackJobs(skills);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('company');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('requiredSkills');
      expect(result[0]).toHaveProperty('source', 'generated');
    });

    it('should include skill names in job descriptions', () => {
      const skills = ['Python', 'Django'];
      const result = generateFallbackJobs(skills);
      const allDescriptions = result.map((j) => j.description).join(' ');
      expect(allDescriptions).toContain('Python');
    });

    it('should set externalId for deduplication', () => {
      const skills = ['JavaScript'];
      const result = generateFallbackJobs(skills);
      for (const job of result) {
        expect(job.externalId).toBeDefined();
        expect(typeof job.externalId).toBe('string');
      }
    });

    it('should use top 5 skills as requiredSkills', () => {
      const skills = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const result = generateFallbackJobs(skills);
      for (const job of result) {
        expect(job.requiredSkills.length).toBeLessThanOrEqual(5);
      }
    });
  });
});
