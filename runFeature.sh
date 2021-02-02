mkdir -p ./test/report
node node_modules/@ln-maf/preprocessor/exec.js  packages/$*
node node_modules/@cucumber/cucumber/bin/cucumber-js --require "packages/$*/features/**/*.js" packages/$*/tmp/features 
result=$?
exit $result
