#! /usr/bin/env node

'use strict';

const fs = require('fs');
const glob = require('glob');
const { execSync } = require('child_process');
const semver = require('semver')
const logger = require('../lib/logger');
const Package = require('../lib/package');


module.exports = function boot (config, args, flags, opts, cb) {

  Object.keys(config.packages).forEach( (name) => {    
    const module = new Package(config).setPackage(name);

    // If scope is defined skip other packages
    if (flags.scope && flags.scope !== name) {
      return;
    }

    process.chdir(module.getPath());

    execSync('rm -rf node_modules/');

    // Check local Package dependencies if we should do some clever linking
    const dependents = module.getDependencies();
    const devDependents = module.getDevDependencies();
    if (dependents || devDependents) {
      // Create Temp Package.json for installable packages
      fs.renameSync( 'package.json', 'package.json.backup')

      const tempFactory = function(dependents, type) {
        return {
            [type]: Object.keys(dependents).reduce((deps, dep) => {
            const dependency = new Package(config).setPackage(dep);
            
            if (!dependency) {
              const version = dependents[dep];          
              deps[dep] = version || "*";
            }
            
            return deps;
          }, {})
        }
      }
      let tempJson = {}
      if (dependents) {
        tempJson = Object.assign(tempJson, tempFactory(dependents, 'dependencies'));
      }
      if (devDependents) {
        tempJson = Object.assign(tempJson, tempFactory(devDependents, 'devDependencies'));
      }

      fs.writeFileSync('package.json', JSON.stringify(tempJson));

      execSync('npm install --loglevel=error');

      // Rollback package.json
      // TODO migrate from SYNC to promises / try catch
      fs.unlink('package.json');
      fs.renameSync( 'package.json.backup', 'package.json');

      // Check if we need a node_modules folder
      if (Object.keys(dependents).length && !fs.existsSync('node_modules')) {
        fs.mkdirSync('node_modules');
      }

      Object.keys(dependents).forEach( (name) => {
        const version = dependents[name];
        const current = new Package(config).setPackage(name);
        if (current) {
          logger(`Found local package: ${current.getName()}`);
                    
          let actions = {};

          if (semver.valid(version)) {
            actions = {
              equal: semver.clean(version) === semver.clean(current.getVersion()),
              lt: semver.lt(version, current.getVersion())
            };
          } else {            
            actions = {
              equal: false,
              lt: semver.ltr(current.getVersion(), semver.Range(version)),
              symlink: semver.satisfies(current.getVersion(), semver.Range(version))
            };
          }
          
          if (actions.symlink) {

            if (current.isPrivate() && !fs.existsSync(`node_modules/${current.getScope()}`)) {
              fs.mkdirSync(`node_modules/${current.getScope()}`);
            }
            // Symlink the current package folder
            logger(`Creating Symlink: ${current.getName() + '@' + version}`);
            fs.symlinkSync(module.getPath(), 'node_modules/' + current.getName())
          } else if (actions.equal) {
            // Copy Package into internal node_modules
            logger(`Copying Package: ${current.getName() + '@' + version}`);
            fs.mkdirSync('node_modules/' + current.getName());
            execSync('cp -r ' + current.getPath() + ' ./node_modules/');
          } else if (actions.lt) {
            // If version is less than current package fetch from NPM
            logger(`Fetching from NPM: ${current.getName()}@${version}`);
            execSync(`npm install --save ${current.getName()}@${version}`);
          } else {
            logger(`Version error: ${current.getName() + '@' + version}`);
          }
        }
      })
    }    
  });
}
