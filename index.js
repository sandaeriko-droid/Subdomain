const fs = require('fs');
const { INPUT_FILE, MAX_CONCURRENT } = require('./config');
const { getSubdomains } = require('./dnsDiscovery');
const { extractFeedsFromHtml, trySuffixFeeds } = require('./rssExtractor');
const { parseSitemap } = require('./sitemapParser');
const { fetchWithTimeout } = require('./fetcher');
const { saveResults } = require('./storage');

async function findRSS(domain) {
    // Normalize domain to URL
    const target = domain.startsWith('http') ? domain : 'https://' + domain;
    let origin;
    
    try { 
        origin = new URL(target).origin; 
    } catch(e) { 
        console.error(`Invalid domain: ${domain}`);
        return []; 
    }

    let feeds = [];

    // Try fetching the main page and extracting feeds from HTML
    try {
        const htmlRes = await fetchWithTimeout(target);
        if (htmlRes.ok && htmlRes.text) {
            const extractedFeeds = extractFeedsFromHtml(htmlRes.text, target);
            if (extractedFeeds.length > 0) {
                feeds = [...feeds, ...extractedFeeds];
            }
        }
    } catch (e) {
        // Continue to next method
    }

    // If no feeds found in HTML, try common suffixes
    if (feeds.length === 0) {
        try {
            const suffixFeeds = await trySuffixFeeds(origin);
            feeds = [...feeds, ...suffixFeeds];
        } catch (e) {
            // Ignore errors
        }
    }

    // Deduplicate feeds by URL
    const seen = new Set();
    feeds = feeds.filter(f => {
        if (seen.has(f.url)) return false;
        seen.add(f.url);
        return true;
    });

    return feeds;
}

async function processDomain(domain) {
    console.log(`Scanning subdomains for ${domain}...`);
    const results = [];
    
    try {
        const subdomains = await getSubdomains(domain);
        console.log(`  Found ${subdomains.length} subdomains for ${domain}`);

        for (const sd of subdomains) {
            try {
                const feeds = await findRSS(sd);
                if (feeds.length > 0) {
                    console.log(`  [✓] ${sd}: ${feeds.length} feed(s) found`);
                    results.push({ domain: sd, feeds });
                } else {
                    console.log(`  [ ] ${sd}: No feeds found`);
                }
            } catch (e) {
                console.error(`  Error processing ${sd}: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(`Error getting subdomains for ${domain}: ${e.message}`);
    }

    return results;
}

async function main() {
    console.log('RSS Enterprise Scanner Starting...\n');
    
    // Read input file
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Error: Input file '${INPUT_FILE}' not found.`);
        console.log(`Please create a ${INPUT_FILE} file with one domain per line.`);
        process.exit(1);
    }

    const rawDomains = fs.readFileSync(INPUT_FILE, 'utf-8')
        .split('\n')
        .map(l => l.trim())
        .filter(line => line && !line.startsWith('#'));  // Skip comments and empty lines

    if (rawDomains.length === 0) {
        console.error(`Error: No domains found in ${INPUT_FILE}`);
        process.exit(1);
    }

    console.log(`Loaded ${rawDomains.length} domain(s) from ${INPUT_FILE}\n`);

    const allResults = [];

    // Process domains sequentially to avoid overwhelming DNS
    for (const d of rawDomains) {
        const results = await processDomain(d);
        allResults.push(...results);
        
        // Small delay between domains
        if (rawDomains.indexOf(d) < rawDomains.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Save results
    saveResults(allResults);
    
    console.log(`\nDone! Found feeds for ${allResults.length} subdomain(s).`);
    console.log(`Total feeds discovered: ${allResults.reduce((sum, r) => sum + r.feeds.length, 0)}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
