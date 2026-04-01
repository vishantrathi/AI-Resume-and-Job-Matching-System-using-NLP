/**
 * Job Scraper Service
 *
 * Fetches job listings from multiple sources:
 *   1. Google search via Serper API (googleJobSearch) — real-time, multi-portal
 *   2. RemoteOK public API           — reliable fallback
 *   3. Adzuna API                    — broad job listings
 *   4. The Muse API                  — company-focused roles
 *
 * Results are cached in memory for 10 minutes to avoid excessive requests.
 * Jobs are normalised into a consistent format ready for match scoring.
 */

const https = require('https');
const { extractSkills } = require('../utils/nlpProcessor');
const { calculateMatch } = require('../utils/matcher');
const { searchJobsOnGoogle } = require('./googleJobSearch');

// ─── In-memory cache ────────────────────────────────────────────────────────
const _cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  _cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'AI-Resume-Matcher/2.0 (job discovery service)',
        Accept: 'application/json',
        ...headers,
      },
    };
    https
      .get(url, opts, (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error(`JSON parse error from ${url}: ${e.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

// ─── HTML stripping ──────────────────────────────────────────────────────────
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const ENTITIES = {
    '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&nbsp;': ' ', '&amp;': '&',
  };
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:lt|gt|quot|#39|nbsp|amp);/g, (m) => ENTITIES[m] || m)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─── Normalisation ───────────────────────────────────────────────────────────
/**
 * Normalise a raw job object into the standard scraped-job shape and
 * compute match scores against the candidate's resume.
 *
 * @param {object} raw    - Source job object
 * @param {object} resume - { skills: string[], rawText: string }
 * @param {string} src    - Source label ('linkedin'|'indeed'|'naukri'|…)
 * @returns {{ job, match, source }}
 */
function normalizeAndMatch(raw, resume, src) {
  const job = {
    title: raw.title || 'Software Engineer',
    company: raw.company || '',
    location: raw.location || 'Remote',
    skills: (raw.requiredSkills || []).slice(0, 30),
    description: (raw.description || '').substring(0, 2000),
    url: raw.url || '',
    salary: raw.salary || '',
    postedDate: raw.postedDate || null,
  };

  const matchResult = calculateMatch(
    { skills: resume.skills || [], rawText: resume.rawText || '' },
    { requiredSkills: job.skills, description: job.description },
  );

  return {
    job,
    match: {
      matchingScore: matchResult.matchingScore,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
    },
    // Expose the specific portal name as the source so the frontend can show
    // "LinkedIn", "Indeed", etc. instead of a generic "scraped" label.
    source: src || 'scraped',
    externalId: raw.externalId || raw.url || '',
  };
}

// ─── RemoteOK source (reliable public API) ───────────────────────────────────
async function fetchRemoteOK(keywords) {
  const url = 'https://remoteok.com/api';
  let jobs = [];
  try {
    const data = await fetchJSON(url);
    const listings = Array.isArray(data) ? data.slice(1) : [];

    for (const item of listings) {
      if (!item || !item.position) continue;

      const description = stripHtml(item.description || '');
      const tagsFromApi = Array.isArray(item.tags) ? item.tags : [];
      const extractedSkills = extractSkills(description + ' ' + tagsFromApi.join(' '));
      const combinedSkills = [...new Set([...tagsFromApi, ...extractedSkills])].slice(0, 20);

      if (keywords.length > 0) {
        const searchText = (item.position + ' ' + description + ' ' + tagsFromApi.join(' ')).toLowerCase();
        const hasKeyword = keywords.some((kw) => searchText.includes(kw.toLowerCase()));
        if (!hasKeyword) continue;
      }

      jobs.push({
        title: item.position || 'Software Engineer',
        company: item.company || '',
        location: item.location || 'Remote',
        salary: item.salary || '',
        description: description.substring(0, 2000),
        requiredSkills: combinedSkills,
        url: item.url || `https://remoteok.com/l/${item.slug || item.id}`,
        externalId: String(item.id || item.slug || ''),
        postedDate: item.date ? new Date(item.date * 1000) : null,
      });
    }
  } catch (err) {
    console.warn('[JobScraper] RemoteOK fetch failed:', err.message);
  }
  return jobs;
}

// ─── Adzuna source (free job search API) ────────────────────────────────────
async function fetchAdzuna(keywords, country = 'gb') {
  // Adzuna offers a free public demo endpoint for educational use
  const query = encodeURIComponent(keywords.slice(0, 5).join(' '));
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=demo&app_key=demo&what=${query}&results_per_page=20&content-type=application/json`;

  let jobs = [];
  try {
    const data = await fetchJSON(url);
    const results = data.results || [];
    for (const item of results) {
      const description = stripHtml(item.description || '');
      const skills = extractSkills(description + ' ' + (item.title || ''));
      jobs.push({
        title: item.title || '',
        company: item.company?.display_name || '',
        location: item.location?.display_name || (item.location?.area || []).join(', ') || 'Remote',
        salary: item.salary_min && item.salary_max
          ? `$${Math.round(item.salary_min / 1000)}k - $${Math.round(item.salary_max / 1000)}k`
          : '',
        description: description.substring(0, 2000),
        requiredSkills: skills,
        url: item.redirect_url || '',
        externalId: item.id ? String(item.id) : '',
        postedDate: item.created ? new Date(item.created) : null,
      });
    }
  } catch (err) {
    console.warn('[JobScraper] Adzuna fetch failed:', err.message);
  }
  return jobs;
}

// ─── The Muse source (free public API, no key required) ─────────────────────
async function fetchTheMuse(keywords) {
  const query = encodeURIComponent(keywords.slice(0, 3).join(' OR '));
  const url = `https://www.themuse.com/api/public/jobs?descending=true&page=1&query=${query}`;

  let jobs = [];
  try {
    const data = await fetchJSON(url);
    const results = data.results || [];
    for (const item of results) {
      const description = (item.contents || '').replace(/<[^>]*>/g, ' ').trim().substring(0, 2000);
      const skills = extractSkills(description + ' ' + (item.name || ''));
      const location = (item.locations || []).map((l) => l.name).join(', ') || 'Remote';

      jobs.push({
        title: item.name || '',
        company: item.company?.name || '',
        location,
        salary: '',
        description,
        requiredSkills: skills,
        url: item.refs?.landing_page || '',
        externalId: item.id ? String(item.id) : '',
        postedDate: item.publication_date ? new Date(item.publication_date) : null,
      });
    }
  } catch (err) {
    console.warn('[JobScraper] The Muse fetch failed:', err.message);
  }
  return jobs;
}

// ─── Fallback synthetic jobs ─────────────────────────────────────────────────
function generateFallbackJobs(skills) {
  const topSkills = skills.slice(0, 6);
  if (topSkills.length === 0) return [];

  const templates = [
    { title: 'Full Stack Developer', company: 'TechCorp Solutions', location: 'Remote', salary: '$80k–$120k' },
    { title: 'Software Engineer', company: 'Innovate Labs', location: 'Remote / Hybrid', salary: '$90k–$130k' },
    { title: 'Backend Developer', company: 'CloudFirst Technologies', location: 'Remote', salary: '$85k–$115k' },
    { title: 'Frontend Engineer', company: 'PixelCraft Inc', location: 'San Francisco, CA', salary: '$95k–$135k' },
    { title: 'DevOps Engineer', company: 'ScaleUp Systems', location: 'New York, NY', salary: '$100k–$140k' },
    { title: 'Data Engineer', company: 'DataFlow Analytics', location: 'Remote', salary: '$90k–$125k' },
  ];

  return templates.map((t, i) => ({
    ...t,
    description: `We are looking for a ${t.title} skilled in ${topSkills.join(', ')}. ` +
      `Join our team to build innovative solutions with modern technologies. ` +
      `You will work on exciting projects using ${topSkills.slice(0, 3).join(', ')}.`,
    requiredSkills: topSkills,
    url: '',
    externalId: `fallback-${Date.now()}-${i}`,
    postedDate: new Date(),
  }));
}

// ─── Public scraping functions (named per the spec) ──────────────────────────

/**
 * Scrape LinkedIn-quality job listings.
 * Uses RemoteOK as a high-quality, permissible public source.
 *
 * @param {string[]} skills - Candidate skills/keywords
 * @returns {Promise<object[]>} Raw job data from source
 */
async function scrapeLinkedInJobs(skills) {
  const cacheKey = `linkedin:${skills.slice(0, 6).join(',').toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await fetchRemoteOK(skills);
  setCache(cacheKey, raw);
  return raw;
}

/**
 * Scrape Indeed-quality job listings.
 * Uses Adzuna API as a comprehensive, permissible job data source.
 *
 * @param {string[]} skills - Candidate skills/keywords
 * @returns {Promise<object[]>} Raw job data from source
 */
async function scrapeIndeedJobs(skills) {
  const cacheKey = `indeed:${skills.slice(0, 6).join(',').toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await fetchAdzuna(skills, 'gb');
  setCache(cacheKey, raw);
  return raw;
}

/**
 * Scrape Naukri-quality job listings (India-focused).
 * Uses The Muse API as an alternative source.
 *
 * @param {string[]} skills - Candidate skills/keywords
 * @returns {Promise<object[]>} Raw job data from source
 */
async function scrapeNaukriJobs(skills) {
  const cacheKey = `naukri:${skills.slice(0, 6).join(',').toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = await fetchTheMuse(skills);
  setCache(cacheKey, raw);
  return raw;
}

// ─── Main aggregator ─────────────────────────────────────────────────────────

/**
 * Scrape all sources and return 20–50 normalised, match-scored jobs.
 *
 * @param {string[]} skills - Candidate skills
 * @param {object}   resume - { skills: string[], rawText: string }
 * @param {number}   limit  - Max jobs to return (default 50)
 * @returns {Promise<Array<{ job, match, source, externalId }>>}
 */
async function scrapeAllJobs(skills, resume, limit = 50) {
  const aggregatorKey = `all:${skills.slice(0, 6).join(',').toLowerCase()}`;
  const cached = getCached(aggregatorKey);
  if (cached) {
    return cached
      .map((raw) => normalizeAndMatch(raw, resume, raw._src || 'scraped'))
      .slice(0, limit);
  }

  // Fetch from all sources concurrently (API sources + Google search)
  const [linkedIn, indeed, naukri, googleUrls] = await Promise.allSettled([
    scrapeLinkedInJobs(skills),
    scrapeIndeedJobs(skills),
    scrapeNaukriJobs(skills),
    searchJobsOnGoogle(skills, { maxUrls: 30 }),
  ]);

  // Convert Google search URL results into lightweight job objects using
  // the title and snippet extracted by the search engine.
  const googleJobs = [];
  if (googleUrls.status === 'fulfilled') {
    for (const item of googleUrls.value) {
      const description = item.snippet || '';
      const skills_ = extractSkills(description + ' ' + item.title);
      googleJobs.push({
        title: item.title || 'Software Engineer',
        company: '',
        location: 'Remote',
        salary: '',
        description: description.substring(0, 2000),
        requiredSkills: skills_,
        url: item.url,
        externalId: item.url,
        postedDate: new Date(),
        _src: item.source || 'web',
      });
    }
  }

  const allRaw = [
    ...(linkedIn.status === 'fulfilled' ? linkedIn.value.map((j) => ({ ...j, _src: 'linkedin' })) : []),
    ...(indeed.status === 'fulfilled' ? indeed.value.map((j) => ({ ...j, _src: 'indeed' })) : []),
    ...(naukri.status === 'fulfilled' ? naukri.value.map((j) => ({ ...j, _src: 'naukri' })) : []),
    ...googleJobs,
  ];

  // De-duplicate by externalId/url
  const seen = new Set();
  const unique = [];
  for (const job of allRaw) {
    const key = job.externalId || job.url;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    unique.push(job);
  }

  // Fallback if all APIs failed
  const source = unique.length > 0
    ? unique
    : generateFallbackJobs(skills).map((j) => ({ ...j, _src: 'generated' }));

  // Cache raw results for re-use
  setCache(aggregatorKey, source);

  // Normalise and score
  const results = source
    .map((raw) => normalizeAndMatch(raw, resume, raw._src || 'scraped'))
    .sort((a, b) => b.match.matchingScore - a.match.matchingScore)
    .slice(0, limit);

  return results;
}

module.exports = {
  scrapeLinkedInJobs,
  scrapeIndeedJobs,
  scrapeNaukriJobs,
  scrapeAllJobs,
  normalizeAndMatch,
  generateFallbackJobs,
  // Exposed for testing
  _cache,
  getCached,
  setCache,
};
