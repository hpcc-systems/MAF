var reporter = require('cucumber-html-reporter');
 
var options = {
        theme: 'bootstrap',
        jsonFile: 'test/report/cucumber_report.json',
        output: `test/report/${process.env.ENVIRONMENT}/cucumber_report.html`,
        reportSuiteAsScenarios: true,
        launchReport: false
    };
 
    reporter.generate(options);
    

