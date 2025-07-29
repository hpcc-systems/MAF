# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0](https://github.com/hpcc-systems/MAF/compare/@ln-maf/validations@4.0.0-beta.5...@ln-maf/validations@4.0.0) (2025-07-29)


### Bug Fixes

* Update package.json files to remove author fields, update versioning, and improve descriptions ([e276aaf](https://github.com/hpcc-systems/MAF/commit/e276aaf6c53bd1edb83193f148261070bc292277))





# [4.0.0-beta.5](https://github.com/hpcc-systems/MAF/compare/@ln-maf/validations@4.0.0-beta.4...@ln-maf/validations@4.0.0-beta.5) (2025-07-25)


### Features

* add ajv dependency for JSON schema validation ([849281a](https://github.com/hpcc-systems/MAF/commit/849281ac704398f7d55297e3f250a71d7705037d))
* Enhance JSON manipulation functions with improved error handling and utility methods ([aa59b25](https://github.com/hpcc-systems/MAF/commit/aa59b256f4fcfd678b0c096ab103f7735df3d6f2))





# [4.0.0-beta.4](https://github.com/hpcc-systems/MAF/compare/@ln-maf/validations@4.0.0-beta.3...@ln-maf/validations@4.0.0-beta.4) (2025-07-24)

**Note:** Version bump only for package @ln-maf/validations





# [4.0.0-beta.3](https://github.com/hpcc-systems/MAF/compare/@ln-maf/validations@4.0.0-beta.2...@ln-maf/validations@4.0.0-beta.3) (2025-07-23)

**Note:** Version bump only for package @ln-maf/validations





# [4.0.0-beta.2](https://github.com/hpcc-systems/MAF/compare/@ln-maf/validations@4.0.0-beta.1...@ln-maf/validations@4.0.0-beta.2) (2025-07-23)

**Note:** Version bump only for package @ln-maf/validations





# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased in Git]

## [1.2.0] (2020-02-03)
### Added
* Fixes for multiple areas of the app based on adding more code coverage
* Git statuses
* Changelog 

* Created a preprocessor package to allow injection of Gherkin within feature files.

* API package for api requests
* SQL package for sql commands
* Validations package for performing processing.

## [1.2.1] (2020-02-03)
### Added
 * Fixes for set examples, there was an issue when a background step was included
 * Add .npmignore
 * Adding in eslint
 * Multiple bug fixes due to issues found by eslint

## [1.3.0] (2020-02-05)
### Added
 * Added in AWS testing for S3, DynamoDB, SQS, Lambda (not tested yet).  
     * Is able to run on localstack but uses the portmap due to some configurability issues with SQS.
