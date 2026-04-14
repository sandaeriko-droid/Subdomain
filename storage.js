const fs = require('fs');
const path = require('path');
const { OUTPUT_JSON, OUTPUT_TXT } = require('./config');

function saveResults(results) {
    // Ensure output directory exists
    const jsonDir = path.dirname(OUTPUT_JSON);
    const txtDir = path.dirname(OUTPUT_TXT);
    
    if (jsonDir && jsonDir !== '.' && !fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
    }
    if (txtDir && txtDir !== '.' && !fs.existsSync(txtDir)) {
        fs.mkdirSync(txtDir, { recursive: true });
    }

    // Save JSON results
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
    
    // Save text results
    const txtLines = [];
    for (const r of results) {
        txtLines.push(`=== ${r.domain} ===`);
        for (const f of r.feeds) {
            txtLines.push(`${f.url} [${f.type || 'unknown'}]`);
        }
        txtLines.push('');
    }
    fs.writeFileSync(OUTPUT_TXT, txtLines.join('\n'));
    
    console.log(`Results saved to ${OUTPUT_JSON} and ${OUTPUT_TXT}`);
}

module.exports = { saveResults };
