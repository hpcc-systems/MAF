mkdir -p ./test/report
node node_modules/@ln-maf/preprocessor/exec.js  packages/$* --packageLocation test
cd packages/$*
node ../../node_modules/nyc/bin/nyc.js --reporter=lcov --reporter=text cucumber-js --require "test/**/*.js" tmp/test 
result=$?
exit $result
