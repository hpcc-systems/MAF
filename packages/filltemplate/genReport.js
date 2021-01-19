var reporter = require('cucumber-html-reporter');
 
var options = {
        theme: 'bootstrap',
        jsonFile: 'cucumber_report.json',
        output: `test/report/cucumber_report.html`,
        reportSuiteAsScenarios: true,
        launchReport: false
    };
 
    reporter.generate(options);
    

