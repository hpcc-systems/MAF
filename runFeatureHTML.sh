node node_modules/@ln-maf/preprocessor/exec.js  packages/$* --packageLocation test
cd packages/$*
node ../../node_modules/@cucumber/cucumber/bin/cucumber-js  --format json cucumber-js --require "test/**/*.js" tmp/test > ../../test/report/$*.json
result=$?
cd -
node node_modules/@ln-maf/core/multiReport.js
exit $result

