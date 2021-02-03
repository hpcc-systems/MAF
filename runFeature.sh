mkdir -p ./test/report
node node_modules/@ln-maf/preprocessor/exec.js  packages/$* --packageLocation test
node node_modules/@cucumber/cucumber/bin/cucumber-js --require "packages/$*/test/**/*.js" packages/$*/tmp/test 
result=$?
exit $result
