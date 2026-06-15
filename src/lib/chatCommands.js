/**
 * Local Chat Command Handler — Expanded Intelligence
 * 
 * Handles common CRM queries locally by calling data APIs directly,
 * without consuming AI API credits. Falls back to AI for complex/creative tasks.
 * 
 * v2: Added fuzzy matching, tier/city/inactive queries, delivery stats,
 *     comparison queries, and best-channel analysis.
 */

import { api } from './api';

// ─── Intent Detection ────────────────────────────────────────────

const INTENTS = [
  // Greetings & help
  { id: 'help', patterns: [/^help$/i, /what can you do/i, /^commands$/i, /how to use/i, /^hi$/i, /^hello$/i, /^hey$/i, /^yo$/i, /what are you/i, /who are you/i], keywords: ['help', 'commands', 'hello', 'hi', 'hey'] },

  // Customer queries
  { id: 'customer_stats', patterns: [/how many customers/i, /customer count/i, /total customers/i, /customer stats/i, /customer statistics/i, /customers? do (we|i) have/i], keywords: ['customer', 'stats', 'statistics', 'count', 'total'] },
  { id: 'top_spenders', patterns: [/top spend/i, /highest spend/i, /biggest spend/i, /top customers/i, /best customers/i, /vip customers/i, /top spender/i, /most valuable/i, /highest paying/i], keywords: ['top', 'spenders', 'vip', 'best', 'valuable', 'highest'] },
  { id: 'recent_customers', patterns: [/recent customers/i, /new customers/i, /latest customers/i, /newest customers/i, /recently (added|joined|signed)/i], keywords: ['recent', 'new', 'latest', 'newest', 'joined'] },
  { id: 'search_customers', patterns: [/^(find|search|look up|lookup)\s+(customer|person|user)/i, /customer.*(named|called|name is)/i], keywords: ['find', 'search', 'lookup'] },
  { id: 'list_customers', patterns: [/show.*(all\s+)?customers/i, /list.*(all\s+)?customers/i, /^customers$/i, /get customers/i, /display customers/i], keywords: ['show', 'list', 'all', 'customers'] },

  // Tier-based queries
  { id: 'customers_by_tier', patterns: [/(show|list|get|who|find).*(gold|silver|bronze)\s*(tier|customers?|users?)?/i, /(gold|silver|bronze)\s*(tier|customers?|users?)/i, /tier\s+(gold|silver|bronze)/i], keywords: ['gold', 'silver', 'bronze', 'tier'] },

  // City-based queries
  { id: 'customers_by_city', patterns: [/customers?\s+(in|from|at|near)\s+(.+)/i, /(show|list|find|get)\s+.*customers?\s+(in|from)\s+(.+)/i, /who.*(lives?|located|based)\s+(in|at)\s+(.+)/i], keywords: ['city', 'location', 'from', 'based'] },

  // Inactive / churned customers
  { id: 'inactive_customers', patterns: [/inactive customers/i, /dormant customers/i, /(haven't|hasn't|have not|has not)\s+(purchased|bought|ordered|visited)/i, /churn/i, /at risk/i, /lost customers/i, /lapsed customers/i, /no.*(purchase|order|activity)/i], keywords: ['inactive', 'dormant', 'churn', 'lapsed', 'risk'] },

  // Segments
  { id: 'list_segments', patterns: [/show.*segments/i, /list.*segments/i, /^segments$/i, /all segments/i, /my segments/i, /existing segments/i, /get segments/i], keywords: ['segments', 'list', 'show'] },
  { id: 'segment_count', patterns: [/how many segments/i, /segment count/i, /total segments/i, /number of segments/i], keywords: ['segment', 'count', 'total', 'how many'] },

  // Campaigns
  { id: 'list_campaigns', patterns: [/show.*campaigns/i, /list.*campaigns/i, /^campaigns$/i, /all campaigns/i, /my campaigns/i, /get campaigns/i, /recent campaigns/i], keywords: ['campaigns', 'list', 'show'] },
  { id: 'campaign_count', patterns: [/how many campaigns/i, /campaign count/i, /total campaigns/i, /number of campaigns/i], keywords: ['campaign', 'count', 'total', 'how many'] },

  // Analytics & stats
  { id: 'overview', patterns: [/^overview$/i, /^stats$/i, /^dashboard$/i, /show.*overview/i, /show.*stats/i, /crm stats/i, /overall stats/i, /summary/i, /give.*overview/i, /performance overview/i, /how are we doing/i, /how.*(things|business)/i], keywords: ['overview', 'stats', 'dashboard', 'summary', 'performance'] },
  { id: 'campaign_analytics', patterns: [/campaign.*analytics/i, /campaign.*performance/i, /campaign.*stats/i, /how.*campaigns.*doing/i, /campaign results/i], keywords: ['campaign', 'analytics', 'performance', 'results'] },
  { id: 'channel_analytics', patterns: [/channel.*analytics/i, /channel.*performance/i, /channel.*stats/i, /which channel/i, /channel breakdown/i, /channel comparison/i], keywords: ['channel', 'analytics', 'breakdown', 'comparison'] },

  // Delivery / engagement stats
  { id: 'delivery_stats', patterns: [/delivery rate/i, /open rate/i, /click rate/i, /engagement/i, /how.*(deliver|open|click)/i, /message.*(stats|performance|rate)/i, /sent.*(stats|performance|rate)/i, /bounce rate/i], keywords: ['delivery', 'open', 'click', 'rate', 'engagement', 'bounce'] },

  // Best / worst analysis
  { id: 'best_channel', patterns: [/best channel/i, /top channel/i, /most effective channel/i, /which channel.*(best|work|perform)/i, /recommend.*channel/i], keywords: ['best', 'channel', 'effective', 'recommend'] },
  { id: 'worst_campaigns', patterns: [/worst campaign/i, /failed campaign/i, /low.*(performing|delivery|open)/i, /underperform/i, /poor.*campaign/i, /bad.*campaign/i], keywords: ['worst', 'failed', 'underperform', 'poor', 'bad'] },

  // High-value segment
  { id: 'high_value_segment', patterns: [/high.*(value|spend|worth)/i, /big spender/i, /spender.*over/i, /spent more than/i, /spent over/i, /premium customers/i], keywords: ['high', 'value', 'spend', 'premium', 'worth'] },
];

function detectIntent(message) {
  const trimmed = message.trim();

  // 1. Exact regex matching (high confidence)
  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      const match = trimmed.match(pattern);
      if (match) return { id: intent.id, match, confidence: 1 };
    }
  }

  // 2. Fuzzy keyword scoring (medium confidence fallback)
  const words = trimmed.toLowerCase().split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    if (!intent.keywords) continue;
    let score = 0;
    for (const keyword of intent.keywords) {
      if (words.some(w => w.includes(keyword) || keyword.includes(w))) {
        score++;
      }
    }
    const normalizedScore = score / intent.keywords.length;
    if (normalizedScore > bestScore && normalizedScore >= 0.4) {
      bestScore = normalizedScore;
      bestMatch = { id: intent.id, match: null, confidence: normalizedScore };
    }
  }

  return bestMatch;
}

// ─── Command Handlers ────────────────────────────────────────────

const handlers = {

  help: async () => ({
    content: `Hey! I'm your Luxe & Co. CRM copilot.

Try asking me things like:
• "show customers" or "top spenders"
• "inactive customers" or "gold tier"
• "campaign performance" or "open rates"
• "create a segment of high value users"
• "draft an SMS campaign"

Or just ask me anything — I'll figure it out!`,
  }),

  customer_stats: async () => {
    const stats = await api.getCustomerStats();
    const tiers = (stats.tierDistribution || []).map(t => `• **${t.tier || 'Unassigned'}**: ${t._count} customers`).join('\n');
    const channels = (stats.channelDistribution || []).map(c => `• **${c.channelPreference || 'None'}**: ${c._count}`).join('\n');
    const spend = stats.spendStats || {};

    return {
      content: `**Customer Statistics**\n\nTotal Customers: **${stats.totalCustomers?.toLocaleString()}**\n\n**Spend Overview**\n• Average: ₹${Math.round(spend._avg?.totalSpend || 0).toLocaleString()}\n• Total: ₹${Math.round(spend._sum?.totalSpend || 0).toLocaleString()}\n• Highest: ₹${Math.round(spend._max?.totalSpend || 0).toLocaleString()}\n• Lowest: ₹${Math.round(spend._min?.totalSpend || 0).toLocaleString()}\n\n**Tier Distribution**\n${tiers}\n\n**Channel Preferences**\n${channels}`,
    };
  },

  top_spenders: async () => {
    const data = await api.getCustomers({ sortBy: 'totalSpend', sortOrder: 'desc', limit: 10 });
    const customers = data.customers || [];
    if (!customers.length) return { content: 'No customers found.' };

    const list = customers.map((c, i) =>
      `${i + 1}. **${c.name}** — ₹${c.totalSpend?.toLocaleString()} (${c.orderCount} orders, ${c.tier || 'no tier'})`
    ).join('\n');

    return {
      content: `**Top 10 Spenders**\n\n${list}\n\nTotal customers: ${data.pagination?.total?.toLocaleString() || '-'}`,
    };
  },

  recent_customers: async () => {
    const data = await api.getCustomers({ sortBy: 'createdAt', sortOrder: 'desc', limit: 10 });
    const customers = data.customers || [];
    if (!customers.length) return { content: 'No customers found.' };

    const list = customers.map((c, i) => {
      const date = new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${i + 1}. **${c.name}** — ${c.email} (joined ${date})`;
    }).join('\n');

    return {
      content: `**10 Most Recent Customers**\n\n${list}`,
    };
  },

  search_customers: async (message) => {
    const searchMatch = message.match(/(?:find|search|look\s*up|lookup)\s+(?:customer|person|user)\s+(.+)/i)
      || message.match(/customer.*(?:named|called|name is)\s+(.+)/i);
    const search = searchMatch ? searchMatch[1].trim().replace(/['"]/g, '') : '';
    if (!search) return { content: 'Please specify a name or email. Example: "Find customer Ranbir"' };

    const data = await api.getCustomers({ search, limit: 5 });
    const customers = data.customers || [];
    if (!customers.length) return { content: `No customers found matching "${search}".` };

    const list = customers.map(c =>
      `**${c.name}** — ${c.email}\n• Location: ${c.city || '-'} | Spend: ₹${c.totalSpend?.toLocaleString()} | Tier: ${c.tier || '-'} | Channel: ${c.channelPreference || '-'}`
    ).join('\n\n');

    return {
      content: `**Search Results for "${search}"** (${customers.length} found)\n\n${list}`,
    };
  },

  list_customers: async () => {
    const data = await api.getCustomers({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
    const customers = data.customers || [];
    if (!customers.length) return { content: 'No customers in the system yet.' };

    const list = customers.map((c, i) =>
      `${i + 1}. **${c.name}** — ${c.email} | ₹${c.totalSpend?.toLocaleString()} | ${c.tier || '-'}`
    ).join('\n');

    return {
      content: `**Customers** (showing 10 of ${data.pagination?.total?.toLocaleString() || '-'})\n\n${list}\n\nTry "top spenders", "gold tier customers", or "customers in Mumbai" for filtered views.`,
    };
  },

  // ─── NEW: Tier-based customer lookup ────────────────────────────
  customers_by_tier: async (message) => {
    const tierMatch = message.match(/(gold|silver|bronze)/i);
    const tier = tierMatch ? tierMatch[1].toLowerCase() : 'gold';
    const data = await api.getCustomers({ tier, sortBy: 'totalSpend', sortOrder: 'desc', limit: 10 });
    const customers = data.customers || [];

    if (!customers.length) return { content: `No **${tier}** tier customers found.` };

    const list = customers.map((c, i) =>
      `${i + 1}. **${c.name}** — ₹${c.totalSpend?.toLocaleString()} | ${c.orderCount} orders | ${c.city || '-'}`
    ).join('\n');

    return {
      content: `**${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier Customers** (${data.pagination?.total || customers.length} total)\n\n${list}`,
    };
  },

  // ─── NEW: City-based customer lookup ────────────────────────────
  customers_by_city: async (message) => {
    const cityMatch = message.match(/(?:in|from|at|near)\s+([a-zA-Z\s]+)/i);
    let city = cityMatch ? cityMatch[1].trim().replace(/[?.!]/g, '') : '';
    if (!city) return { content: 'Please specify a city. Example: "customers in Mumbai"' };

    const data = await api.getCustomers({ search: city, limit: 10 });
    const customers = (data.customers || []).filter(c =>
      c.city && c.city.toLowerCase().includes(city.toLowerCase())
    );

    if (!customers.length) return { content: `No customers found in **${city}**.` };

    const list = customers.map((c, i) =>
      `${i + 1}. **${c.name}** — ₹${c.totalSpend?.toLocaleString()} | ${c.tier || '-'} | ${c.email}`
    ).join('\n');

    return {
      content: `**Customers in ${city}** (${customers.length} found)\n\n${list}`,
    };
  },

  // ─── NEW: Inactive / Churned customers ─────────────────────────
  inactive_customers: async () => {
    const data = await api.getCustomers({ sortBy: 'lastActive', sortOrder: 'asc', limit: 10 });
    const customers = data.customers || [];
    if (!customers.length) return { content: 'No customer activity data available.' };

    const list = customers.map((c, i) => {
      const lastActive = c.lastActive
        ? new Date(c.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Never';
      const daysSince = c.lastActive
        ? Math.floor((Date.now() - new Date(c.lastActive).getTime()) / 86400000)
        : '∞';
      return `${i + 1}. **${c.name}** — Last active: ${lastActive} (${daysSince} days ago) | ₹${c.totalSpend?.toLocaleString()} | ${c.tier || '-'}`;
    }).join('\n');

    return {
      content: `**Most Inactive Customers** (potential churn risk)\n\n${list}\n\n💡 Consider creating a win-back campaign for these customers.`,
      action: {
        type: 'create_segment',
        payload: { 
          name: 'Inactive Customers (At Risk)',
          description: 'Customers who have not purchased recently.',
          rules: [{ field: 'daysSinceLastVisit', operator: '>', value: '30' }]
        }
      }
    };
  },

  // ─── NEW: Delivery / engagement stats ──────────────────────────
  delivery_stats: async () => {
    const data = await api.getOverview();
    if (!data) return { content: 'Could not load performance data.' };

    const perf = data.performance || {};
    const deliveryRate = perf.totalSent ? Math.round((perf.totalDelivered / perf.totalSent) * 100) : 0;
    const openRate = perf.totalDelivered ? Math.round((perf.totalOpened / perf.totalDelivered) * 100) : 0;
    const clickRate = perf.totalOpened ? Math.round((perf.totalClicked / perf.totalOpened) * 100) : 0;
    const readRate = perf.totalDelivered ? Math.round((perf.totalRead / perf.totalDelivered) * 100) : 0;

    return {
      content: `**Message Performance Overview**\n\n• **Sent**: ${(perf.totalSent || 0).toLocaleString()}\n• **Delivered**: ${(perf.totalDelivered || 0).toLocaleString()} (**${deliveryRate}%** delivery rate)\n• **Opened**: ${(perf.totalOpened || 0).toLocaleString()} (**${openRate}%** open rate)\n• **Read**: ${(perf.totalRead || 0).toLocaleString()} (**${readRate}%** read rate)\n• **Clicked**: ${(perf.totalClicked || 0).toLocaleString()} (**${clickRate}%** click rate)\n• **Failed**: ${(perf.totalFailed || 0).toLocaleString()}\n\n${deliveryRate >= 95 ? '✅ Delivery rate is excellent!' : deliveryRate >= 85 ? '⚠️ Delivery rate could be improved.' : '🔴 Delivery rate needs attention.'}`,
    };
  },

  // ─── NEW: Best channel analysis ────────────────────────────────
  best_channel: async () => {
    const data = await api.getChannelAnalytics();
    const channels = Array.isArray(data) ? data : data?.channels || [];
    if (!channels.length) return { content: 'No channel analytics available yet. Send some campaigns first!' };

    const ranked = channels.map(ch => {
      const sent = ch.totalSent ?? ch.sent ?? 0;
      const delivered = ch.totalDelivered ?? ch.delivered ?? 0;
      const opened = ch.totalOpened ?? ch.opened ?? 0;
      const delRate = sent ? Math.round((delivered / sent) * 100) : 0;
      const openRate = delivered ? Math.round((opened / delivered) * 100) : 0;
      return { name: ch.channel, sent, delivered, opened, delRate, openRate, campaigns: ch.campaignCount ?? ch.campaigns ?? 0 };
    }).sort((a, b) => b.delRate - a.delRate);

    const list = ranked.map((ch, i) =>
      `${i + 1}. **${ch.name?.toUpperCase()}** — ${ch.delRate}% delivery, ${ch.openRate}% open rate (${ch.campaigns} campaigns, ${ch.sent.toLocaleString()} sent)`
    ).join('\n');

    const best = ranked[0];

    return {
      content: `**Channel Performance Ranking**\n\n${list}\n\n🏆 **${best.name?.toUpperCase()}** is your best performing channel with **${best.delRate}%** delivery rate and **${best.openRate}%** open rate.`,
    };
  },

  // ─── NEW: Worst campaigns ──────────────────────────────────────
  worst_campaigns: async () => {
    const data = await api.getCampaignAnalytics();
    const campaigns = Array.isArray(data) ? data : data?.campaigns || [];
    if (!campaigns.length) return { content: 'No campaign analytics available yet.' };

    const ranked = campaigns.map(c => {
      const delRate = c.totalSent ? Math.round((c.totalDelivered / c.totalSent) * 100) : 0;
      return { ...c, delRate };
    }).sort((a, b) => a.delRate - b.delRate).slice(0, 5);

    const list = ranked.map((c, i) =>
      `${i + 1}. **${c.name}** (${c.channel}) — ${c.delRate}% delivery | Sent: ${c.totalSent}, Failed: ${(c.totalSent || 0) - (c.totalDelivered || 0)} | Status: ${c.status}`
    ).join('\n');

    return {
      content: `**Lowest Performing Campaigns**\n\n${list}\n\n💡 Consider reviewing your audience targeting and message content for these campaigns.`,
    };
  },

  // ─── NEW: High-value customer segment ──────────────────────────
  high_value_segment: async () => {
    const data = await api.getCustomers({ sortBy: 'totalSpend', sortOrder: 'desc', limit: 10 });
    const customers = data.customers || [];
    if (!customers.length) return { content: 'No customers found.' };

    const avgSpend = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0) / customers.length;

    const list = customers.map((c, i) =>
      `${i + 1}. **${c.name}** — ₹${c.totalSpend?.toLocaleString()} | ${c.orderCount} orders | ${c.tier || '-'} tier | ${c.city || '-'}`
    ).join('\n');

    return {
      content: `**High-Value Customers** (Top 10)\n\n${list}\n\nAverage spend of top 10: **₹${Math.round(avgSpend).toLocaleString()}**`,
      action: {
        type: 'create_segment',
        payload: { 
          name: `High Value Customers (Spenders > ₹${Math.round(avgSpend).toLocaleString()})`,
          description: 'Top spenders based on average spend of the top 10.',
          rules: [{ field: 'totalSpent', operator: '>', value: String(Math.round(avgSpend)) }]
        }
      }
    };
  },

  // ─── Existing handlers (unchanged logic, improved formatting) ──

  list_segments: async () => {
    const segments = await api.getSegments();
    if (!segments?.length) return { content: 'No segments created yet. Ask me to "create a segment" to get started!' };

    const list = segments.map((s, i) =>
      `${i + 1}. **${s.name}** — ${s.customerCount} customers${s.description ? ` | ${s.description}` : ''}${s.aiGenerated ? ' [AI]' : ''}`
    ).join('\n');

    return {
      content: `**Segments** (${segments.length} total)\n\n${list}`,
    };
  },

  segment_count: async () => {
    const segments = await api.getSegments();
    const aiCount = (segments || []).filter(s => s.aiGenerated).length;
    return {
      content: `You have **${segments?.length || 0}** segments total (${aiCount} AI-generated, ${(segments?.length || 0) - aiCount} manual).`,
    };
  },

  list_campaigns: async () => {
    const data = await api.getCampaigns({ limit: 10 });
    const campaigns = data.campaigns || [];
    if (!campaigns.length) return { content: 'No campaigns created yet. Ask me to "create a campaign" to get started!' };

    const statusIcon = { draft: '📝', sending: '🔄', sent: '📤', completed: '✅', failed: '❌', stopped: '⏹️' };
    const list = campaigns.map((c, i) =>
      `${i + 1}. ${statusIcon[c.status] || '•'} **${c.name}** — ${c.channel} | ${c.status} | Sent: ${c.totalSent}, Delivered: ${c.totalDelivered}`
    ).join('\n');

    return {
      content: `**Campaigns** (${data.pagination?.total || campaigns.length} total)\n\n${list}`,
    };
  },

  campaign_count: async () => {
    const data = await api.getCampaigns({ limit: 1 });
    return {
      content: `You have **${data.pagination?.total || 0}** campaigns in total.`,
    };
  },

  overview: async () => {
    const data = await api.getOverview();
    if (!data) return { content: 'Could not load overview data.' };

    const perf = data.performance || {};
    const deliveryRate = perf.totalSent ? Math.round((perf.totalDelivered / perf.totalSent) * 100) : 0;
    const openRate = perf.totalDelivered ? Math.round((perf.totalOpened / perf.totalDelivered) * 100) : 0;

    return {
      content: `**CRM Overview**\n\n• Customers: **${data.totalCustomers?.toLocaleString() || 0}**\n• Segments: **${data.totalSegments || 0}**\n• Campaigns: **${data.totalCampaigns || 0}**\n\n**Campaign Performance**\n• Messages Sent: ${perf.totalSent?.toLocaleString() || 0}\n• Delivered: ${perf.totalDelivered?.toLocaleString() || 0} (${deliveryRate}%)\n• Opened: ${perf.totalOpened?.toLocaleString() || 0} (${openRate}%)\n• Failed: ${perf.totalFailed?.toLocaleString() || 0}\n\n${data.recentCustomers ? `📈 ${data.recentCustomers} new customers in the last 30 days.` : ''}`,
    };
  },

  campaign_analytics: async () => {
    const data = await api.getCampaignAnalytics();
    const campaigns = Array.isArray(data) ? data : data?.campaigns || [];
    if (!campaigns.length) return { content: 'No campaign analytics available yet.' };

    const list = campaigns.slice(0, 8).map(c => {
      const delRate = c.totalSent ? Math.round((c.totalDelivered / c.totalSent) * 100) : 0;
      return `**${c.name}** (${c.channel}) — ${c.status}\n• Sent: ${c.totalSent} | Delivered: ${delRate}% | Opened: ${c.totalOpened}`;
    }).join('\n\n');

    return {
      content: `**Campaign Performance**\n\n${list}`,
    };
  },

  channel_analytics: async () => {
    const data = await api.getChannelAnalytics();
    const channels = Array.isArray(data) ? data : data?.channels || [];
    if (!channels.length) return { content: 'No channel analytics available yet.' };

    const list = channels.map(ch => {
      const sent = ch.totalSent ?? ch.sent ?? 0;
      const delivered = ch.totalDelivered ?? ch.delivered ?? 0;
      const delRate = sent ? Math.round((delivered / sent) * 100) : 0;
      const opened = ch.totalOpened ?? ch.opened ?? 0;
      const campaigns = ch.campaignCount ?? ch.campaigns ?? 0;
      return `**${ch.channel?.toUpperCase()}** — ${campaigns} campaigns\n• Sent: ${sent.toLocaleString()} | Delivered: ${delRate}% | Opened: ${opened.toLocaleString()}`;
    }).join('\n\n');

    return {
      content: `**Channel Breakdown**\n\n${list}`,
    };
  },
};

// ─── Main Entry Point ────────────────────────────────────────────

export async function handleLocalCommand(message) {
  const intent = detectIntent(message);
  if (!intent) return { handled: false };

  const handler = handlers[intent.id];
  if (!handler) return { handled: false };

  try {
    const result = await handler(message);
    return { handled: true, ...result };
  } catch (error) {
    return {
      handled: true,
      content: `Sorry, I couldn't fetch that data: ${error.message}`,
      error: true,
    };
  }
}
