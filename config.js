module.exports = {
    INPUT_FILE: 'domains.txt',
    OUTPUT_JSON: 'rss-results.json',
    OUTPUT_TXT: 'rss-results.txt',
    MAX_CONCURRENT: 50,        // Parallel worker
    DNS_CONCURRENT: 100,       // Subdomain enumeration
    FETCH_TIMEOUT: 3000,
    FEED_TYPES: [
        'application/rss+xml','application/atom+xml','application/rdf+xml',
        'application/rss','application/atom','application/rdf',
        'text/rss+xml','text/atom+xml','text/rdf+xml',
        'text/rss','text/atom','text/rdf'
    ],
    FEED_SUFFIXES: ['/feed','/rss','/rss.xml','/feed.xml'],
    CONTENT_WORDLIST: ['news','media','blog','rss','api','press'] // Extendable
};
