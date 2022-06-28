AWSENV='FALSE';
npx cucumber-js -f json:test/report/cucumber_report.json --require "stepDefinitions/*.js" test/$*
val=$?
npx multiReport
exit $val