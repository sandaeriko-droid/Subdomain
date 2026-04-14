const { fetchWithTimeout } = require('./fetcher');

async function parseSitemap(domain) {
    const urls = [];
    
    // Ensure domain has protocol
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    let origin;
    
    try {
        origin = new URL(baseUrl).origin;
    } catch (e) {
        return [];
    }

    // Try common sitemap locations
    const sitemapUrls = [
        `${origin}/sitemap.xml`,
        `${origin}/sitemap_index.xml`,
        `${baseUrl}/sitemap.xml`
    ];

    for (const sitemapUrl of sitemapUrls) {
        try {
            const res = await fetchWithTimeout(sitemapUrl);
            if (!res.ok || !res.text) continue;

            // Extract URLs from <loc> tags
            const locMatches = [...res.text.matchAll(/<loc>([^<]+)<\/loc>/gi)];
            for (const match of locMatches) {
                const url = match[1].trim();
                if (url && !urls.includes(url)) {
                    urls.push(url);
                }
            }

            // If this is a sitemap index, recursively parse referenced sitemaps
            if (res.text.includes('<sitemapindex')) {
                const sitemapRefs = [...res.text.matchAll(/<loc>([^<]+)<\/loc>/gi)];
                for (const ref of sitemapRefs) {
                    const sitemapUrl2 = ref[1].trim();
                    if (sitemapUrl2 && !sitemapUrls.includes(sitemapUrl2)) {
                        // Limit recursion to avoid infinite loops
                        if (urls.length < 1000) {
                            const subUrls = await fetchSitemapUrls(sitemapUrl2);
                            for (const u of subUrls) {
                                if (!urls.includes(u)) urls.push(u);
                            }
                        }
                    }
                }
            }

            if (urls.length > 0) break;
        } catch (e) {
            continue;
        }
    }

    return urls;
}

async function fetchSitemapUrls(sitemapUrl) {
    const urls = [];
    try {
        const res = await fetchWithTimeout(sitemapUrl);
        if (!res.ok || !res.text) return urls;

        const locMatches = [...res.text.matchAll(/<loc>([^<]+)<\/loc>/gi)];
        for (const match of locMatches) {
            const url = match[1].trim();
            if (url && !urls.includes(url)) {
                urls.push(url);
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return urls;
}

module.exports = { parseSitemap };
