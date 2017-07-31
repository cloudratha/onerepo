const fs = require('fs');
const chalk = require('chalk');
const semver = require('semver');

module.exports = class Package {
  constructor(config) {
    this.config = config;
    // Clone Packages to not pass by reference
    this.packages = JSON.parse(JSON.stringify(config.packages));
  }
  setPackage(name) {
    if (name.indexOf('/') > 0) {      
      name = name.split('/')[1];
    }
    if (this.packages[name]) {
      this.package = this.packages[name];
      return this;
    }

    return false;
  }
  getPath() {
    return this.package.path;
  }
  getName() {
    return this.package.json.name;
  }
  getScope() {
    if (this.isPrivate()) {
      return this.getName().split('/')[0];
    }

    return false;
  }
  getVersion() {
    return this.package.json.version;
  }
  getDependencies() {
    if (this.hasDependencies()) {
      return this.package.json.dependencies;      
    }

    return false;
  }
  getDevDependencies() {
    if (this.hasDevDependencies()) {
      return this.package.json.devDependencies;      
    }

    return false;
  }
  getPeerDependencies() {
    if (this.hasPeerDependencies()) {
      return this.package.json.peerDependencies;      
    }

    return false;
  }
  isPrivate() {
    return (this.getName().indexOf('@') !== -1);
  }
  hasDependencies() {
    return (this.package.json.dependencies);
  }
  hasDevDependencies() {
    return (this.package.json.devDependencies);
  }
  hasPeerDependencies() {
    return (this.package.json.peerDependencies);
  }
  hasDependant(name) {
    if (this.hasDependencies()) {
      return Object.keys(this.getDependencies()).includes(name);
    }

    return false;
  }
  hasLocalDependant(name) {
    return (this.hasDependant(name) && this.packages[name]);
  }
  getDependant(name) {
    
    if (this.hasDependant(name)) {
      return {
        name: name,
        version: this.package.json.dependencies[name]
      };
    }

    return false;
  }
  isTrackingDependant(name) {
    if (this.hasDependant(name)) {
      const dependant = this.getDependant(name);
      if (dependant) {
        // Needs to be a Semver Range to Track
        if (!semver.valid(dependant.version)) {
          return semver.satisfies(this.packages[name].json.version, semver.Range(dependant.version));
        }
      }
    }

    return false;
  }

  updateVersion(version) {
    this.package.json.version = version;
    return this;
  }

  updateDependency(name, version) {
    if (this.hasDependant(name)) {
      let dependencies = this.getDependencies();
      dependencies[name] = version;
      this.package.json.dependencies = dependencies;
    }
    return this;
  }

  writeJson() {
    process.chdir(this.package.path);
    fs.writeFileSync('package.json', JSON.stringify(this.package.json, null, 2));
    return this;
  }
};
