const dns = require('dns').promises;
const { CONTENT_WORDLIST, DNS_CONCURRENT } = require('./config');

const resolver = new dns.Resolver();
resolver.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);

async function getSubdomains(rootDomain) {
    const found = new Set([rootDomain]);
    
    // Also try www subdomain by default
    const prefixes = [...new Set(['www', ...CONTENT_WORDLIST])];
    const queue = [];
    
    // Generate all potential subdomains
    for (const prefix of prefixes) {
        queue.push(`${prefix}.${rootDomain}`);
    }

    const worker = async () => {
        while (queue.length > 0) {
            const target = queue.shift();
            if (!target) continue;
            
            try {
                // Try resolving IPv4
                await resolver.resolve4(target);
                found.add(target);
            } catch (e) {
                try {
                    // Fallback to IPv6
                    await resolver.resolve6(target);
                    found.add(target);
                } catch (e2) {
                    // Not found
                }
            }
        }
    };

    // Limit concurrent workers
    const workerCount = Math.min(DNS_CONCURRENT, queue.length);
    const workers = Array(workerCount).fill(null).map(() => worker());
    await Promise.all(workers);
    
    return Array.from(found);
}

module.exports = { getSubdomains };
