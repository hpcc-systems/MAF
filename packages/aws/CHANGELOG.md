# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.1.6](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.1.5...@ln-maf/aws@4.1.6) (2025-10-28)

**Note:** Version bump only for package @ln-maf/aws





## [4.1.5](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.1.4...@ln-maf/aws@4.1.5) (2025-09-18)

**Note:** Version bump only for package @ln-maf/aws





## [4.1.4](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.1.2...@ln-maf/aws@4.1.4) (2025-09-18)

**Note:** Version bump only for package @ln-maf/aws





## [4.1.3](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.1.2...@ln-maf/aws@4.1.3) (2025-09-18)

**Note:** Version bump only for package @ln-maf/aws





## [4.1.2](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.1.1...@ln-maf/aws@4.1.2) (2025-09-15)


### Features

* add support for limit parameter in DynamoDB queries and update related scenarios ([7c93088](https://github.com/hpcc-systems/MAF/commit/7c930885b9cd912249ca5ce4de87a8e67f27ebff))





## [4.1.1](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.1.0...@ln-maf/aws@4.1.1) (2025-07-31)

**Note:** Version bump only for package @ln-maf/aws





# 4.1.0 (2025-07-31)


### Bug Fixes

* update peer dependency for @ln-maf/core to version 4.0.0 across multiple packages ([f6a05f9](https://github.com/hpcc-systems/MAF/commit/f6a05f91ed564be6ba3874a3c9ad89cd4c58f6dc))


### Features

* add Docker Compose configuration and Terraform setup for LocalStack integration; update test scripts and remove deprecated runFeature.sh ([ba70084](https://github.com/hpcc-systems/MAF/commit/ba70084c8abf42ee498614c331827305c40ee8c9))



# 4.0.0 (2025-07-29)


### Features

* Added new sqs step difition to check the aproximite number of messages ([74a3b12](https://github.com/hpcc-systems/MAF/commit/74a3b1265925d2efc7518b43ef50400331be493c))



# 3.0.0-beta.0 (2024-01-24)



## 1.6.1 (2022-04-10)



# 1.6.0 (2022-02-24)



# 1.5.0 (2021-12-13)


### Reverts

* Revert "v1.5.0" ([58f7b56](https://github.com/hpcc-systems/MAF/commit/58f7b56cb9fda278b85a0198bc6265ca2f63b49c))



## 1.4.4 (2021-05-18)



## 1.4.3 (2021-04-22)



## 1.3.11 (2021-03-26)



## 1.3.10 (2021-03-22)



## 1.3.2 (2021-02-07)



# 1.3.0 (2021-02-05)





# [4.0.0](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.0.0-beta.6...@ln-maf/aws@4.0.0) (2025-07-29)


### Bug Fixes

* Update package.json files to remove author fields, update versioning, and improve descriptions ([e276aaf](https://github.com/hpcc-systems/MAF/commit/e276aaf6c53bd1edb83193f148261070bc292277))





# [4.0.0-beta.6](https://github.com/hpcc-systems/MAF/compare/@ln-maf/aws@4.0.0-beta.5...@ln-maf/aws@4.0.0-beta.6) (2025-07-25)

**Note:** Version bump only for package @ln-maf/aws





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
