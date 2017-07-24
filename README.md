Onerepo
===========================================

One repo to rule them all, and in the webpack, bind them.

Using the monorepo strategy it allows a single source for all the individual packages, hosted with npm.

## Requirements

Node >= 6.4.0

## Installation

Install as a global node dependency from git (instead of NPM).

```bash
npm install -g git+ssh://git@github.com:pokelondon/onerepo.git
```

### Usage

Create a Git Repo and initialise.

Create a `config.json` file in the root of the repo.

```js
{
  "packages": [
    "collection-1/*",
    "collection-2/*"
  ],
  "scope": "username"
}
```

`packages` are the working directorys for your packages scoped from the root.
`scope` is the npm user who the packages are published under. You will need to be authenticated with this user when publishing.

Setup the initial packages with their files and include in their `package.json`.
Make sure to include the [scope](https://docs.npmjs.com/misc/scope) in the package name. 

`repo boot` will allow for the correct use of scoping the project, and can be run at anytime during development.

You will be unable to publish successfully without first committing the changes, as it will attempt to publish new tags.

## Package Dependencies

Onerepo will handle collecting the correct dependencies for your packages.
It will either fetch from npm, clone, or symlink packages that require other packages, based on the dependency version.

Onerepo will not do any smart linking on DevDependencies, so if a package is a dependency in another it should be a normal dependency.

If the version is tracking the latest release prefix'd with a caret (^), the package will be symlinked.
This allows you to continue in development without needing to publish each change.

```js
{
  "name": "package-A",
  "version": "3.4.22"
}

{
  "name": "package-B",
  "version": "2.2.1",
  "dependencies": {
    "package-A": "^3.4.22"
  }
}
```

If the version is an exact match between the package and dependency, it will clone the package.

```js
{
  "name": "package-A",
  "version": "3.4.22"
}

{
  "name": "package-B",
  "version": "2.2.1",
  "dependencies": {
    "package-A": "3.4.22"
  }
}
```

If the version is lower it will npm install the package

```js
{
  "name": "package-A",
  "version": "3.4.22"
}

{
  "name": "package-B",
  "version": "2.2.1",
  "dependencies": {
    "package-A": "2.4.10"
  }
}
```


## Commands

```bash
npm run repo [args]
```

### Bootstrap

Recursively runs through all the packages and installs all the package dependencies.
Safe to run at any stage during development.
```bash
repo boot --[flags]
```

### Run

Recursively runs through each package and executes npm scripts.
```bash
repo run [command] --[flags]
```

### Publish

Recursively run through each package to upgrade versions, git tag, and publish to NPM.
By default it will attempt to publish all packages, pass through the `scope` flag to target a specific package.
```bash
repo publish --[flags]
```

## Flags

There are a few helper flags:

### Scope

Will run the command in context of the specific package.
```bash
--scope=[package-name]
```

### No-Boot (Publish Only)

When publishing you can add the flag to prevent re-booting the packages.
```bash
repo publish --no-boot
```

### Verbose

Show verbose logging in the CLI
```bash
-v
```
