const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter(file => !file.startsWith('.git/'));

const checks = [
  { name: 'PEM private key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Solana keypair JSON candidate', regex: /^\s*\[(?:\s*\d+\s*,){31,}\s*\d+\s*\]\s*$/m },
  { name: 'hard-coded mnemonic assignment', regex: /(?:mnemonic|seed[_ -]?phrase)\s*[:=]\s*["'][^"'\n]{24,}["']/i },
  { name: 'hard-coded private-key assignment', regex: /(?:private[_ -]?key|secret[_ -]?key)\s*[:=]\s*["'][A-Za-z0-9+/=_:-]{24,}["']/i }
];

const findings = [];
for (const file of tracked) {
  let content;
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > 2_000_000) continue;
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const check of checks) {
    if (check.regex.test(content)) findings.push({ file, type: check.name });
  }
}

if (findings.length) {
  console.error('Potential secret material detected in tracked source:');
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.type}`);
  process.exit(1);
}

console.log(`Secret guard passed: ${tracked.length} tracked files scanned.`);
