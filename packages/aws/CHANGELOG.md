# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-beta.5](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.0.0-beta.4...@ln-maf/aws@4.0.0-beta.5) (2025-07-24)

**Note:** Version bump only for package @ln-maf/aws





# [4.0.0-beta.4](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.0.0-beta.3...@ln-maf/aws@4.0.0-beta.4) (2025-07-23)


### Features

* remove allowed directories check for file path traversal ([dfa20d3](https://github.com/hpcc-systems/MAF/commit/dfa20d3f04c07f399ee43e22d01790804c6a5004))





# [4.0.0-beta.3](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.0.0-beta.2...@ln-maf/aws@4.0.0-beta.3) (2025-07-23)

**Note:** Version bump only for package @ln-maf/aws





# [4.0.0-beta.2](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.0.0-beta.1...@ln-maf/aws@4.0.0-beta.2) (2025-07-23)

**Note:** Version bump only for package @ln-maf/aws

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
