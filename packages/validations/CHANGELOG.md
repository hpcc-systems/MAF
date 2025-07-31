# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.1.1](https://github.com/hpcc-systems/MAF/compare/@ln-maf/validations@4.1.0...@ln-maf/validations@4.1.1) (2025-07-31)

**Note:** Version bump only for package @ln-maf/validations





# 4.1.0 (2025-07-31)


### Bug Fixes

* update peer dependency for @ln-maf/core to version 4.0.0 across multiple packages ([f6a05f9](https://github.com/hpcc-systems/MAF/commit/f6a05f91ed564be6ba3874a3c9ad89cd4c58f6dc))


### Features

* add functions to find differences between objects and strings, and improve error formating ([01444b2](https://github.com/hpcc-systems/MAF/commit/01444b2c675fe8f9d2298c550a4170fb33a4c708))
* enhance JSON manipulation features with improved key deletion and path checking ([fc52cf1](https://github.com/hpcc-systems/MAF/commit/fc52cf1619f1d452a1bd8e97cd18d448c138a976))



# 4.0.0 (2025-07-29)


### Bug Fixes

* remove duplicate background step in setting feature ([347a74d](https://github.com/hpcc-systems/MAF/commit/347a74da6a28f36016615825849b09bcd4925686))


### Features

* update API test scenarios and enhance request handling; remove deprecated requests feature ([27afe44](https://github.com/hpcc-systems/MAF/commit/27afe44f8dbcb42a2bda729ec0f88bc017f8215e))



# 3.0.0-beta.0 (2024-01-24)



## 1.6.2 (2022-05-02)



## 1.6.1 (2022-04-10)



# 1.6.0 (2022-02-24)



# 1.5.0 (2021-12-13)


### Reverts

* Revert "v1.5.0" ([58f7b56](https://github.com/hpcc-systems/MAF/commit/58f7b56cb9fda278b85a0198bc6265ca2f63b49c))



## 1.4.4 (2021-05-18)



## 1.4.3 (2021-04-22)



## 1.3.11 (2021-03-26)



## 1.3.10 (2021-03-22)



## 1.3.8 (2021-02-08)



## 1.3.7 (2021-02-08)



## 1.3.6 (2021-02-08)



## 1.3.2 (2021-02-07)



## 1.2.4 (2021-02-04)



## 1.2.3 (2021-02-03)



## 1.2.2 (2021-02-03)



## 1.2.1 (2021-02-03)



# 1.2.0 (2021-02-03)



## 1.1.7 (2021-02-03)



## 1.1.6 (2021-02-03)



## 1.1.5 (2021-02-03)



## 1.1.4 (2021-02-03)



## 1.1.3 (2021-02-03)



## 1.1.1 (2021-02-02)



# 1.1.0 (2021-02-02)



## 1.0.9 (2021-02-01)



## 1.0.8 (2021-01-26)



## 1.0.7 (2021-01-26)



## 1.0.6 (2021-01-26)



## 1.0.5 (2021-01-26)



## 1.0.4 (2021-01-26)



## 1.0.3 (2021-01-26)





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
