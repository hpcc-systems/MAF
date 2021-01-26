#!/bin/sh
#Runs all feature files and opens a Web page displaying the test report. Returns the result of the cucumber function
mkdir -p ./test/report/
node node_modules/cucumber/bin/cucumber-js -f json:test/report/cucumber_report.json features/ --parallel 16 
result=$?
node genReport
exit $result
