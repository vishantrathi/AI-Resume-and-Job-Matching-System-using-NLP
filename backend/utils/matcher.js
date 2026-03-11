/**
 * Semantic Matching Utility
 *
 * Calculates a matching score between candidate skills and job required skills
 * using TF-IDF-inspired term frequency overlap combined with synonym/alias awareness.
 */

const { extractSkills, tokenize, removeStopWords } = require('./nlpProcessor');

// Alias groups — skills in the same group are considered equivalent
const ALIAS_GROUPS = [
  ['javascript', 'js'],
  ['typescript', 'ts'],
  ['node', 'nodejs', 'node.js'],
  ['react', 'reactjs', 'react.js'],
  ['angular', 'angularjs'],
  ['vue', 'vuejs'],
  ['express', 'expressjs', 'express.js'],
  ['postgres', 'postgresql'],
  ['python', 'py'],
  ['golang', 'go'],
  ['kubernetes', 'k8s'],
  ['mongodb', 'mongo'],
  ['machine learning', 'ml'],
  ['natural language processing', 'nlp'],
  ['rest', 'restful', 'rest api'],
  ['next.js', 'nextjs'],
  ['nest.js', 'nestjs'],
  ['ci/cd', 'cicd'],
  ['spring boot', 'springboot'],
  ['react native', 'reactnative'],
  ['scikit-learn', 'sklearn'],
];

/**
 * Build a map from every alias to the canonical form (first in list).
 */
function buildAliasMap() {
  const map = new Map();
  for (const group of ALIAS_GROUPS) {
    const canonical = group[0];
    for (const alias of group) {
      map.set(alias.toLowerCase(), canonical.toLowerCase());
    }
  }
  return map;
}

const ALIAS_MAP = buildAliasMap();

/**
 * Normalise a skill string using the alias map.
 * @param {string} skill
 * @returns {string}
 */
function normaliseSkill(skill) {
  const lower = skill.toLowerCase();
  return ALIAS_MAP.get(lower) || lower;
}

/**
 * Normalise an array of skill strings.
 * @param {string[]} skills
 * @returns {Set<string>}
 */
function normaliseSkills(skills) {
  return new Set(skills.map(normaliseSkill));
}

/**
 * Compute TF-IDF-inspired token overlap score between two text bodies.
 * Used as a secondary signal when explicit skill lists are sparse.
 * @param {string} textA
 * @param {string} textB
 * @returns {number} score between 0 and 1
 */
function tokenOverlapScore(textA, textB) {
  const tokensA = new Set(removeStopWords(tokenize(textA)));
  const tokensB = new Set(removeStopWords(tokenize(textB)));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  // Jaccard similarity
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculate the matching score between a candidate's resume and a job description.
 *
 * @param {object} resume  - { skills: string[], rawText: string }
 * @param {object} job     - { requiredSkills: string[], description: string }
 * @returns {{ matchingScore: number, matchedSkills: string[], missingSkills: string[] }}
 */
function calculateMatch(resume, job) {
  const candidateSkills = normaliseSkills(resume.skills || []);
  const jobSkills = normaliseSkills(job.requiredSkills || []);

  // If neither side has explicit skills, fall back to token overlap
  if (jobSkills.size === 0) {
    const candidateText = resume.rawText || resume.skills.join(' ');
    const jobText = job.description || '';
    const overlap = tokenOverlapScore(candidateText, jobText);
    // Extract skills from job description on-the-fly
    const derivedJobSkills = normaliseSkills(extractSkills(jobText));
    const derivedCandidateSkills = normaliseSkills(resume.skills || []);
    const matched = [...derivedJobSkills].filter((s) => derivedCandidateSkills.has(s));
    const missing = [...derivedJobSkills].filter((s) => !derivedCandidateSkills.has(s));
    const score = Math.round(overlap * 100);
    return { matchingScore: score, matchedSkills: matched, missingSkills: missing };
  }

  const matched = [...jobSkills].filter((s) => candidateSkills.has(s));
  const missing = [...jobSkills].filter((s) => !candidateSkills.has(s));

  // Core score: percentage of required skills that the candidate has
  const skillScore = jobSkills.size > 0 ? matched.length / jobSkills.size : 0;

  // Bonus: token-level text similarity (weighted at 20%)
  const candidateText = (resume.rawText || '') + ' ' + (resume.skills || []).join(' ');
  const jobText = (job.description || '') + ' ' + (job.requiredSkills || []).join(' ');
  const textBonus = tokenOverlapScore(candidateText, jobText);

  const finalScore = Math.round((skillScore * 0.8 + textBonus * 0.2) * 100);

  return {
    matchingScore: Math.min(finalScore, 100),
    matchedSkills: matched.map(capitalise),
    missingSkills: missing.map(capitalise),
  };
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { calculateMatch, normaliseSkill, normaliseSkills, tokenOverlapScore };
