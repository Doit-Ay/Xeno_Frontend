const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── In-Memory Cache ─────────────────────────────────────────────
// Prevents redundant DB calls when switching between tabs.
// GET requests are cached with a TTL; mutations auto-invalidate related caches.

const cache = new Map();
const DEFAULT_TTL = 30_000;       // 30 seconds for most data
const STATS_TTL = 60_000;         // 60 seconds for stats/analytics (changes less often)
const DEDUP_WINDOW = 100;         // Deduplicate identical requests within 100ms

// In-flight request deduplication (prevents double-fetching on fast tab switches)
const inflight = new Map();

function getCacheKey(endpoint) {
  return endpoint;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

/**
 * Invalidate cache entries matching any of the given prefixes.
 * Called after mutations so the next GET fetches fresh data.
 */
function invalidateCache(...prefixes) {
  for (const key of cache.keys()) {
    if (prefixes.some(p => key.includes(p))) {
      cache.delete(key);
    }
  }
}

/** Clear entire cache */
function clearCache() {
  cache.clear();
}

// Determine TTL based on endpoint
function getTTL(endpoint) {
  if (endpoint.includes('/analytics/') || endpoint.includes('/stats')) return STATS_TTL;
  return DEFAULT_TTL;
}

// ─── Fetch with Retry ────────────────────────────────────────────

async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw new Error(
    'Unable to connect to the server. Please check that the backend is running (npm run dev in backend/) and try refreshing the page.'
  );
}

// ─── Core Fetch + Cache Logic ────────────────────────────────────

async function fetchAPI(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isRead = method === 'GET';
  const cacheKey = getCacheKey(endpoint);

  // For GET requests, check cache first
  if (isRead) {
    const cached = getCached(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent identical requests
    if (inflight.has(cacheKey)) {
      return inflight.get(cacheKey);
    }
  }

  const fetchPromise = (async () => {
    let res;
    try {
      res = await fetchWithRetry(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
    } catch (networkError) {
      throw networkError;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
    }

    if (res.status === 503 && data.isConnectionError) {
      const tips = data.troubleshooting
        ? '\n\nTroubleshooting:\n• ' + data.troubleshooting.join('\n• ')
        : '';
      throw new Error((data.error || 'Database is temporarily unavailable.') + tips);
    }

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data;
  })();

  // For GET requests, store promise for deduplication and cache the result
  if (isRead) {
    inflight.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      setCache(cacheKey, result, getTTL(endpoint));
      return result;
    } finally {
      inflight.delete(cacheKey);
    }
  }

  return fetchPromise;
}

// ─── API Methods ─────────────────────────────────────────────────
// Mutations (create/update/delete) automatically invalidate related caches
// so the next tab switch fetches fresh data.

export const api = {
  // Customers (cached)
  getCustomers: (params) => fetchAPI(`/api/customers?${new URLSearchParams(params || {})}`),
  getCustomer: (id) => fetchAPI(`/api/customers/${id}`),
  getCustomerStats: () => fetchAPI('/api/customers/stats'),
  createCustomer: (data) => {
    const p = fetchAPI('/api/customers', { method: 'POST', body: JSON.stringify(data) });
    p.then(() => invalidateCache('/customers')).catch(() => {});
    return p;
  },

  // Segments (cached, invalidated on create/delete)
  getSegments: () => fetchAPI('/api/segments'),
  getSegment: (id, page = 1, limit = 100) => fetchAPI(`/api/segments/${id}?page=${page}&limit=${limit}`),
  createSegment: (data) => {
    const p = fetchAPI('/api/segments', { method: 'POST', body: JSON.stringify(data) });
    p.then(() => invalidateCache('/segments')).catch(() => {});
    return p;
  },
  evaluateSegment: (id) => {
    const p = fetchAPI(`/api/segments/${id}/evaluate`, { method: 'POST' });
    p.then(() => invalidateCache('/segments')).catch(() => {});
    return p;
  },
  previewSegment: (rules) => fetchAPI('/api/segments/preview', { method: 'POST', body: JSON.stringify({ rules }) }),
  deleteSegment: (id) => {
    const p = fetchAPI(`/api/segments/${id}`, { method: 'DELETE' });
    p.then(() => invalidateCache('/segments')).catch(() => {});
    return p;
  },

  // Campaigns (cached, invalidated on create/send/delete)
  getCampaigns: (params) => fetchAPI(`/api/campaigns?${new URLSearchParams(params || {})}`),
  getCampaign: (id) => fetchAPI(`/api/campaigns/${id}`),
  createCampaign: (data) => {
    const p = fetchAPI('/api/campaigns', { method: 'POST', body: JSON.stringify(data) });
    p.then(() => invalidateCache('/campaigns')).catch(() => {});
    return p;
  },
  sendCampaign: (id) => {
    const p = fetchAPI(`/api/campaigns/${id}/send`, { method: 'POST' });
    p.then(() => invalidateCache('/campaigns', '/communications', '/analytics')).catch(() => {});
    return p;
  },
  deleteCampaign: (id) => {
    const p = fetchAPI(`/api/campaigns/${id}`, { method: 'DELETE' });
    p.then(() => invalidateCache('/campaigns')).catch(() => {});
    return p;
  },
  stopCampaign: (id) => {
    const p = fetchAPI(`/api/campaigns/${id}/stop`, { method: 'POST' });
    p.then(() => invalidateCache('/campaigns')).catch(() => {});
    return p;
  },

  // AI Chat (never cached — each message is unique)
  chat: (message, conversationId, model) => fetchAPI('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, conversationId, model }) }),
  generateMessage: (data) => fetchAPI('/api/ai/generate-message', { method: 'POST', body: JSON.stringify(data) }),
  executeAction: (type, data, conversationId) => {
    const p = fetchAPI('/api/ai/execute-action', { method: 'POST', body: JSON.stringify({ type, data, conversationId }) });
    p.then(() => invalidateCache('/segments', '/campaigns')).catch(() => {});
    return p;
  },
  getAIStatus: () => fetchAPI('/api/ai/status'),
  getConversations: () => fetchAPI('/api/ai/conversations'),
  getConversation: (id) => fetchAPI(`/api/ai/conversations/${id}`),

  // Analytics (cached with longer TTL)
  getOverview: () => fetchAPI('/api/analytics/overview'),
  getCampaignAnalytics: () => fetchAPI('/api/analytics/campaigns'),
  getChannelAnalytics: () => fetchAPI('/api/analytics/channels'),

  // Communications (cached)
  getCommunications: (params) => fetchAPI(`/api/communications?${new URLSearchParams(params || {})}`),

  // Health check
  checkHealth: () => fetchAPI('/api/health'),

  // Manual cache control (for components that need force-refresh)
  invalidateCache,
  clearCache,
};
