#! /usr/bin/env node

'use strict';

const fs = require('fs');
const glob = require('glob');
const { execSync } = require('child_process');
const logger = require('../lib/logger');

module.exports = function boot (config, args, flags, opts, cb) {

  Object.keys(config.packages).forEach( (name) => { 
    const module = config.packages[name];

    // If scope is defined skip other packages
    if (flags.scope && flags.scope !== name) {
      return;
    }

    process.chdir(module.path);

    let flatten = [
      args.join(' ')      
    ];

    if (Object.keys(flags).length) {
      const flagFormat = Object.keys(flags).filter( key => {
        const exclude = [ 'scope', 'v', 'vv', 'vvv', 'verbose'];
        return (! exclude.includes(key));
      }).map( key => {
        return `--${key}=${flags[key]}`;
      }).join(' ');
      flatten.push(flagFormat);
    }

    logger(`Executing Script (${name}): npm run ${flatten.join(' ')}`);
    execSync('npm ' + flatten.join(' '));

  });

}
