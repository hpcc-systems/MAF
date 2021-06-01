npx preprocessor  packages/$* --packageLocation test
cd packages/$*
node ../../node_modules/@cucumber/cucumber/bin/cucumber-js  $EXTRAS -f json:../../test/report/$*.json cucumber-js --require "test/**/*.js" tmp/test 
result=$?
cd -
node node_modules/@ln-maf/core/multiReport.js
exit $result

