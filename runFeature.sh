node node_modules/cucumber/bin/cucumber-js -f json:test/report/cucumber_report.json features/$*; node multiReport.js; openPy $PWD/test/report/undefined/index.html
