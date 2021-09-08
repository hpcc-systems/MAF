npx preprocessor  packages/$* --packageLocation test
cd packages/$*
npx cucumber-js  $EXTRAS -f json:../../test/report/$*.json cucumber-js --require "test/**/*.js" tmp/test 
result=$?
cd -
npx multiReport
exit $result

