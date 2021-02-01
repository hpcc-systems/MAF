#Runs one feature file and opens a Web page displaying the test report. Example: ./runFeature.sh S3.feature
mkdir -p ./test/report
node node_modules/@cucumber/cucumber/bin/cucumber-js --format json --require "packages/$*/features/**/*.js" packages/$*/features > test/report/$1.json
result=$?
node node_modules/@ln-maf/core/multiReport.js
exit $result
