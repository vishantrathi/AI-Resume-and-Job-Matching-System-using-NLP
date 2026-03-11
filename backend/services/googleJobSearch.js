/**
 * Google Job Search Service
 *
 * Uses the Serper API (https://serper.dev) to perform real-time Google searches
 * for job listings across multiple portals (LinkedIn, Indeed, Glassdoor, Naukri,
 * Internshala, Wellfound, and company career pages).
 *
 * When no API key is configured the module degrades gracefully and returns an
 * empty URL list so the rest of the scraping pipeline can continue with its
 * existing API-based sources.
 *
 * Environment variables:
 *   SERPER_API_KEY  – Serper.dev API key (https://serper.dev/api-key)
 */

const https = require('https');

// ─── Job-portal URL patterns ──────────────────────────────────────────────────
const PORTAL_PATTERNS = [
  { pattern: 'linkedin.com/jobs', source: 'linkedin' },
  { pattern: 'indeed.com', source: 'indeed' },
  { pattern: 'glassdoor.com', source: 'glassdoor' },
  { pattern: 'naukri.com', source: 'naukri' },
  { pattern: 'internshala.com', source: 'internshala' },
  { pattern: 'wellfound.com', source: 'wellfound' },
  { pattern: 'angel.co', source: 'wellfound' },
  { pattern: 'greenhouse.io', source: 'company' },
  { pattern: 'lever.co', source: 'company' },
  { pattern: 'workday.com', source: 'company' },
  { pattern: 'careers.', source: 'company' },
  { pattern: '/jobs/', source: 'company' },
];

/**
 * Infer the source portal from a URL.
 * @param {string} url
 * @returns {string}
 */
function inferSource(url) {
  const lower = (url || '').toLowerCase();
  for (const { pattern, source } of PORTAL_PATTERNS) {
    if (lower.includes(pattern)) return source;
  }
  return 'web';
}

// ─── HTTP POST helper ─────────────────────────────────────────────────────────
function postJSON(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const [protocol, rest] = url.split('://');
    const slashIdx = rest.indexOf('/');
    const hostname = rest.substring(0, slashIdx === -1 ? rest.length : slashIdx);
    const path = slashIdx === -1 ? '/' : rest.substring(slashIdx);

    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    };

    const mod = protocol === 'https' ? https : require('http');
    const req = mod.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`JSON parse error from ${url}: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Query generation ─────────────────────────────────────────────────────────

/**
 * Build a list of Google search queries from resume skills.
 *
 * Generates two classes of queries:
 *   1. General role queries  – "React developer jobs", "Node.js backend developer jobs"
 *   2. Site-scoped queries   – "site:linkedin.com/jobs React developer"
 *
 * @param {string[]} skills - Extracted resume skills (up to ~10 used)
 * @returns {string[]} Array of search query strings
 */
function buildSearchQueries(skills) {
  const top = skills.slice(0, 8);
  if (top.length === 0) return ['software developer jobs'];

  const queries = [];

  // General role queries
  const primarySkills = top.slice(0, 3);
  queries.push(`${primarySkills.join(' ')} developer jobs`);
  queries.push(`${primarySkills.join(' ')} engineer jobs`);
  if (top.length > 3) {
    queries.push(`${top.slice(0, 5).join(' OR ')} software jobs`);
  }

  // Site-scoped queries for each major portal
  const siteTargets = [
    'site:linkedin.com/jobs',
    'site:indeed.com',
    'site:naukri.com',
    'site:glassdoor.com',
    'site:internshala.com',
    'site:wellfound.com',
  ];

  const skillStr = primarySkills.join(' ');
  for (const site of siteTargets) {
    queries.push(`${site} ${skillStr} developer`);
  }

  return queries;
}

// ─── Serper API search ────────────────────────────────────────────────────────

/**
 * Perform a single Google search via the Serper API and return organic results.
 *
 * @param {string} query
 * @param {string} apiKey
 * @returns {Promise<Array<{ title, link, snippet }>>}
 */
async function serperSearch(query, apiKey) {
  try {
    const data = await postJSON(
      'https://google.serper.dev/search',
      { q: query, num: 10 },
      { 'X-API-KEY': apiKey },
    );
    return data.organic || [];
  } catch (err) {
    console.warn(`[GoogleJobSearch] Serper search failed for "${query}":`, err.message);
    return [];
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Search Google for job listings matching the candidate's resume skills.
 *
 * Returns an array of job-page URLs deduped and annotated with their source
 * portal.  When SERPER_API_KEY is not configured the function returns [] so the
 * rest of the pipeline can fall back to its existing API-based sources.
 *
 * @param {string[]} skills    - Resume skills extracted by NLP
 * @param {object}   [options]
 * @param {number}   [options.maxUrls=30] - Maximum URLs to return
 * @returns {Promise<Array<{ url: string, source: string, title: string, snippet: string }>>}
 */
async function searchJobsOnGoogle(skills, { maxUrls = 30 } = {}) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.info('[GoogleJobSearch] SERPER_API_KEY not set – skipping Google search');
    return [];
  }

  const queries = buildSearchQueries(skills);
  const seen = new Set();
  const results = [];

  // Run searches sequentially to respect rate limits
  for (const query of queries) {
    if (results.length >= maxUrls) break;

    const organic = await serperSearch(query, apiKey);
    for (const item of organic) {
      const url = item.link || '';
      if (!url || seen.has(url)) continue;

      const source = inferSource(url);
      // Only keep URLs that look like actual job listings
      if (source === 'web' && !url.toLowerCase().includes('job')) continue;

      seen.add(url);
      results.push({
        url,
        source,
        title: item.title || '',
        snippet: item.snippet || '',
      });

      if (results.length >= maxUrls) break;
    }
  }

  return results;
}

module.exports = {
  searchJobsOnGoogle,
  buildSearchQueries,
  inferSource,
};
