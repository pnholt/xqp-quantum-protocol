const fs = require('fs');
const path = require('path');

async function main() {
  const outPath = path.join(process.cwd(), 'metrics.json');

  const hasGA = Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY);

  let metrics = {
    visitors_today: 0,
    click_cta: 0,
    start_wallet_connect: 0,
    tx_submitted: 0,
    tx_confirmed: 0,
    join_community: 0
  };

  if (hasGA) {
    // TODO: implement GA4 Data API queries for daily event counts.
  }

  fs.writeFileSync(outPath, JSON.stringify(metrics, null, 2));
  console.log('metrics.json updated at', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

