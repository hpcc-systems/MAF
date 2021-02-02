mkdir -p ./test/report
node node_modules/@ln-maf/preprocessor/exec.js  packages/$*
node node_modules/@cucumber/cucumber/bin/cucumber-js --format json --require "packages/$*/features/**/*.js" packages/$*/tmp/features > test/report/$1.json
result=$?
node node_modules/@ln-maf/core/multiReport.js
exit $result
