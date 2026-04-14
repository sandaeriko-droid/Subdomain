const https = require('https');
const http = require('http');
const { FETCH_TIMEOUT } = require('./config');

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 100,
    timeout: FETCH_TIMEOUT,
    rejectUnauthorized: false
});

const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 100,
    timeout: FETCH_TIMEOUT
});

async function fetchWithTimeout(url) {
    return new Promise((resolve) => {
        let req;
        const isHttps = url.startsWith('https://');
        const agent = isHttps ? httpsAgent : httpAgent;

        const timeoutId = setTimeout(() => {
            if (req) req.destroy();
            resolve({ ok: false, text: '', status: 0, error: 'timeout' });
        }, FETCH_TIMEOUT);

        try {
            req = (isHttps ? https : http).request(url, { 
                agent, 
                rejectUnauthorized: false, 
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Connection': 'keep-alive'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    clearTimeout(timeoutId);
                    resolve({ 
                        ok: res.statusCode >= 200 && res.statusCode < 400, 
                        text: data, 
                        status: res.statusCode,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (err) => {
                clearTimeout(timeoutId);
                resolve({ ok: false, text: '', status: 0, error: err.message });
            });

            req.end();
        } catch (err) {
            clearTimeout(timeoutId);
            resolve({ ok: false, text: '', status: 0, error: err.message });
        }
    });
}

module.exports = { fetchWithTimeout };
