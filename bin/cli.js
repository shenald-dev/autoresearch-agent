/**
 * autoresearch-agent CLI
 */

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const App = require('../src/index');

const argv = yargs(hideBin(process.argv))
  .scriptName('autoresearch-agent')
  .usage('$0 [options]')
  .option('port', {
    alias: 'p',
    type: 'number',
    default: 3000,
    describe: 'Port to listen on'
  })
  .option('mocks-dir', {
    alias: 'd',
    type: 'string',
    default: './mocks',
    describe: 'Mocks directory (if applicable)'
  })
  .help('h')
  .alias('h', 'help')
  .version(false)
  .strict()
  .argv;

const app = new App({
  port: argv.port,
  mocksDir: argv.mocksDir
});

app.start();

