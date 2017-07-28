'use strict'

const fs = require('fs');
const semver = require('semver');
const inquirer = require('inquirer');
const async = require('async');
const { execSync } = require('child_process');
const Package = require('../lib/package');
const versions = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor'];


module.exports = function publish (config, args, flags, opts, cb) {

  let packagesToUpdate = {};

  Object.keys(config.packages).forEach( name => {
    const module = new Package(config).setPackage(name);
    if (flags.scope && flags.scope !== module.getName()) {
      return;
    }
    packagesToUpdate[name] = module;
  });
  
  async.mapValuesLimit(packagesToUpdate, 1, function(module, name, callback) {
    
    let choices = [];
      versions.forEach( type => { 
        choices.push({
          name: `${type}: ${semver.inc(module.getVersion(), type)}`,
          value: semver.inc(module.getVersion(), type)
        });
      });

      inquirer.prompt([{
        type: 'list',
        name: 'prompt',
        message: `Please select a version update for "${name}"`,
        choices: choices,
        pageSize: choices.length
      }]).then( result => {
        callback(null, result.prompt);
      }).catch( err => {
        callback(err);
      });
  }, (err, results) => {
    // TODO Move to Async to run in parallel
    if (results) {
      let tags = [];
      Object.keys(results).forEach( name => {
        const pack = new Package(config).setPackage(name);
        const version = results[name];
        if (pack.hasDependencies()){
          const dependencies = pack.getDependencies();
          
          Object.keys(dependencies).forEach( dependency => {
            if (results[dependency] && pack.hasLocalDependant(dependency) && pack.isTrackingDependant(dependency)) {
              pack.updateDependency(dependency, `^${results[dependency]}`);
            }
          });
        }
        pack.updateVersion(version);
        pack.writeJson();
        
        // Stage changed files to git
        process.chdir(opts.cwd);
        execSync(`git add ${pack.getPath()}/package.json`);

        tags.push({
          path: pack.getPath(),
          tag: `${name}@${version}`
        });        
      });

      if (tags.length > 0) {
        
        // Reboot the package to create correct folder links
        process.chdir(opts.cwd);

        execSync(`git commit -m "Repo Version Bump"`);
        tags.forEach( pack => {

          execSync(`git tag ${pack.tag} -m "${pack.tag}"`);
          process.chdir(pack.path);
          execSync(`npm publish`);
        });        
      }

      if (!flags.boot) {        
        process.chdir(opts.cwd);
        execSync(`repo boot`); // Assume its globally installed
      }
    }

    if (err) {
      console.error(err);
    }
  });
}