'use strict'

const fs = require('fs');
const glob = require('glob');
const commands = require('../commands');

function printUsage () {
  // eslint-disable-next-line no-console
  console.log(`
  repo [command] [options]
  Options:
  -scope <package>
  -v
  Commands:
  - install
  - publish
  - run
`)
}

module.exports = function repo (config, args, flags, opts, cb) {
  const command = args.shift()

  if (!command) {
    printUsage()
    cb(null)
  } else if (commands[command]) {

    let localPackages = {};
  
    config.packages.forEach( (path) => {
      const localPaths = glob.sync(path, opts);

      localPaths.forEach( (folder) => {
        if (!fs.existsSync(`${opts.cwd}/${folder}/package.json`)) {
          return;
        }
        localPackages[folder.split('/')[1]] = {      
          path: opts.cwd + '/' + folder,
          json: JSON.parse(fs.readFileSync(opts.cwd + '/' + folder + '/package.json', 'utf8'))
        };
      });
    });

    config.packages = localPackages;

    commands[command](config, args, flags, opts, err => {
      if (err) {
        cb(err)
      } else {
        cb(null)
      }
    })
  } else {
    cb(new Error(`Unknown command: ${command}`))
  }
}