const { FEED_TYPES, FEED_SUFFIXES } = require('./config');
const { fetchWithTimeout } = require('./fetcher');

function normalizeUrl(href, base) {
    try {
        if (!href || typeof href !== 'string') return '';
        href = href.trim();
        if (href.startsWith('//')) return 'https:' + href;
        if (href.startsWith('/')) {
            const baseUrl = new URL(base);
            return baseUrl.origin + href;
        }
        if (/^https?:\/\//i.test(href)) return href;
        return new URL(href, base).href;
    } catch(e) { 
        return ''; 
    }
}

function extractFeedsFromHtml(html, baseUrl) {
    const feeds = [];
    if (!html) return feeds;

    // Match link tags with RSS/Atom types
    const linkRegex = /<link\s+[^>]*\bhref=['"]([^'"]+)['"][^>]*\btype=['"]([^'"]+)['"][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        const type = match[2].toLowerCase().trim();
        if (FEED_TYPES.includes(type)) {
            const url = normalizeUrl(href, baseUrl);
            if (url) {
                feeds.push({ url, type: match[2], title: url });
            }
        }
    }

    // Also check reverse order (type after href)
    const linkRegex2 = /<link\s+[^>]*\btype=['"]([^'"]+)['"][^>]*\bhref=['"]([^'"]+)['"][^>]*>/gi;
    while ((match = linkRegex2.exec(html)) !== null) {
        const type = match[1].toLowerCase().trim();
        const href = match[2];
        if (FEED_TYPES.includes(type)) {
            const url = normalizeUrl(href, baseUrl);
            if (url && !feeds.some(f => f.url === url)) {
                feeds.push({ url, type: match[1], title: url });
            }
        }
    }

    // Look for RSS links in common patterns
    const rssLinkPatterns = [
        /<a\s+[^>]*href=['"]([^'"]*\.(?:rss|xml|atom)['"])/gi,
        /<a\s+[^>]*href=['"]([^'"]*feed[^'"]*\.(?:xml|rss)['"])/gi
    ];

    for (const pattern of rssLinkPatterns) {
        pattern.lastIndex = 0;
        while ((match = pattern.exec(html)) !== null) {
            const href = match[1].replace(/['"]/g, '');
            const url = normalizeUrl(href, baseUrl);
            if (url && !feeds.some(f => f.url === url)) {
                feeds.push({ url, type: 'application/rss+xml', title: url });
            }
        }
    }

    return feeds;
}

async function trySuffixFeeds(origin) {
    const results = [];
    
    for (const suffix of FEED_SUFFIXES) {
        const url = origin + suffix;
        const res = await fetchWithTimeout(url);
        
        if (res.ok && res.text) {
            // Check if response looks like a feed
            if (/<(?:rss|feed|atom)[\s>]/i.test(res.text) || 
                /<\/(?:rss|feed|atom)>/i.test(res.text) ||
                /<item[\s>]/i.test(res.text) ||
                /<entry[\s>]/i.test(res.text)) {
                results.push({ url, title: 'Auto Feed', type: 'auto-detected' });
            }
        }
    }
    
    return results;
}

module.exports = { extractFeedsFromHtml, trySuffixFeeds, normalizeUrl };
