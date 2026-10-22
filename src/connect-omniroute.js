#!/usr/bin/env node
'use strict';

/**
 * OmniRoute connector for ADCode. There is no API key to walk here: the free AI
 * is a Firebase account behind ADCode's own relay, so the connector registers
 * the bundled bridge as an `openai-compatible` provider node and one connection
 * whose key is the bridge's placeholder. Models come out as `adcode/<model id>`.
 *
 *   node src/connect-omniroute.js [--omniroute-base http://localhost:20128]
 *                              [--omniroute-password 123456]
 *                              [--bridge-url http://127.0.0.1:8917/v1]
 *
 * Start the bridge first: `node src/bridge.js --port 8917`, then point any
 * OpenAI client at the router (`OPENAI_BASE_URL=http://localhost:20128/v1`).
 */

const fs = require('fs');
const path = require('path');

// The lab keeps this file next to `public-cli.js`; the published repo ships it
// as `src/cli.js`. Same layout either way, so one lookup covers both.
const impl = require(fs.existsSync(path.join(__dirname, 'cli.js')) ? './cli.js' : './public-cli.js');

const usage = () => {
  console.log(`adcode-bulk-registry → OmniRoute connector

  node src/connect-omniroute.js                       register the bridge (default port 8917)
  node src/connect-omniroute.js --bridge-url http://127.0.0.1:8917/v1
  node src/connect-omniroute.js --omniroute-base http://localhost:20128 --omniroute-password 123456

  Registration is idempotent: an existing provider-node (prefix "adcode") and
  connection are reused instead of duplicated.`);
};

if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    process.exit(0);
  }
  impl.connectOmniRoute().catch((e) => {
    console.error('[fatal]', e.message);
    process.exit(1);
  });
}

module.exports = { connectOmniRoute: impl.connectOmniRoute, connectKeysFile: impl.connectKeysFile, usage };
