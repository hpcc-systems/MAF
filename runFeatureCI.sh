pwd
node node_modules/@ln-maf/preprocessor/exec.js  packages/$* --packageLocation test
cd packages/$*
node ../../node_modules/@cucumber/cucumber/bin/cucumber-js  cucumber-js --require "test/**/*.js" tmp/test 
result=$?
cd -
exit $result

