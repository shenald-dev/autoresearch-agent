#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const configLib = require('../core/config');
const Orchestrator = require('../core/orchestrator');
const { ensureDir } = require('../core/utils');
const { logger } = require('../core/utils');

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('autoresearch')
    .usage('$0 <topic> [options]')
    .example('$0 "AI trends in 2024" –output ./results')
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'Output directory (default: outputs/)'
    })
    .option('max-results', {
      alias: 'm',
      type: 'number',
      describe: 'Max search results to scrape'
    })
    .option('no-publish', {
      type: 'boolean',
      describe: 'Disable social auto-posting'
    })
    .option('dry-run', {
      type: 'boolean',
      describe: 'Validate config and exit without running'
    })
    .help('h')
    .alias('h', 'help')
    .version('0.1.0')
    .strict()
    .argv;

  // Load config
  let cfg = configLib.loadConfig();

  // Override from CLI
  if (argv['max-results']) {
    cfg.agent.maxSearchResults = argv['max-results'];
  }
  if (argv['no-publish']) {
    cfg.agent.enablePublishing = false;
  }

  // Validate
  const errors = configLib.validateConfig(cfg);
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  // Dry run?
  if (argv['dry-run']) {
    console.log('Config valid! Ready to run.');
    console.log('Settings:', JSON.stringify(cfg, null, 2));
    process.exit(0);
  }

  // Ensure output dirs exist
  ensureDir('outputs/markdown');
  ensureDir('outputs/json');

  // Get topic
  const topic = argv._[0];
  if (!topic) {
    console.error('Error: Topic required');
    console.log(yargs.help());
    process.exit(1);
  }

  // Run orchestrator
  const orchestrator = new Orchestrator(cfg);
  const result = await orchestrator.run(topic);

  if (result.success) {
    console.log('\n✅ Research completed!');
    console.log('Outputs:');
    Object.entries(result.outputs).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    if (Object.values(result.posted).some(p => p)) {
      console.log('Social posts: made');
    }
    process.exit(0);
  } else {
    console.error('\n❌ Research failed:', result.error);
    process.exit(1);
  }
}

main().catch(err => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
