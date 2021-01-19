mkdir -p ./test/report
node node_modules/cucumber/bin/cucumber-js -f json:cucumber_report.json features/
result=$?
node genReport.js
exit $result

