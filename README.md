# RSS Enterprise Scanner

A powerful tool for discovering RSS/Atom feeds across multiple domains and their subdomains.

## Features

- **Subdomain Discovery**: Automatically enumerates common subdomains (www, blog, news, media, etc.)
- **Multiple Feed Detection Methods**:
  - Parses HTML `<link>` tags for RSS/Atom feed declarations
  - Tries common feed URL suffixes (/feed, /rss, /rss.xml, /feed.xml)
  - Validates feed content with regex patterns
- **Concurrent Processing**: Handles multiple DNS queries and HTTP requests in parallel
- **Flexible Output**: Saves results in both JSON and plain text formats
- **Timeout & Error Handling**: Robust error handling with configurable timeouts

## Installation

```bash
npm install
```

## Usage

1. Create a `domains.txt` file with one domain per line:
   ```
   example.com
   wordpress.org
   medium.com
   ```

2. Run the scanner:
   ```bash
   npm start
   # or
   node index.js
   ```

3. Check the output files:
   - `rss-results.json` - Detailed JSON output
   - `rss-results.txt` - Human-readable text output

## Configuration

Edit `config.js` to customize:

- `INPUT_FILE`: Input file with domains (default: 'domains.txt')
- `OUTPUT_JSON`: JSON output file (default: 'rss-results.json')
- `OUTPUT_TXT`: Text output file (default: 'rss-results.txt')
- `MAX_CONCURRENT`: Maximum concurrent workers (default: 50)
- `DNS_CONCURRENT`: Concurrent DNS queries (default: 100)
- `FETCH_TIMEOUT`: HTTP request timeout in ms (default: 3000)
- `FEED_TYPES`: List of MIME types to recognize as feeds
- `FEED_SUFFIXES`: Common feed URL suffixes to try
- `CONTENT_WORDLIST`: Subdomain prefixes to enumerate

## Project Structure

```
rss-enterprise/
├── config.js          # Global configuration
├── index.js           # Main runner
├── fetcher.js         # HTTP fetch with timeout + retry
├── dnsDiscovery.js    # Subdomain enumeration
├── rssExtractor.js    # HTML parsing + feed detection
├── sitemapParser.js   # Sitemap.xml parsing
├── storage.js         # Results storage (JSON/TXT)
├── package.json       # Node.js dependencies
└── domains.txt        # Input domains file
```

## License

MIT
