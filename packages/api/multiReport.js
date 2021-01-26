const report = require('multiple-cucumber-html-reporter');

report.generate({
	jsonDir: './test/report/', 
        reportPath: `test/report/${process.env.ENVIRONMENT}`,
	metadata:{
        browser: {
            name: 'chrome',
            version: '60'
        },
        device: 'Local test machine',
        platform: {
            name: 'ubuntu'
        }
    },
    customData: {
        title: 'Run info',
        data: [
            {label: 'Report Generated:', value: `${new Date()}`}
        ]
    }
});

