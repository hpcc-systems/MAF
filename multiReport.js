const report = require('multiple-cucumber-html-reporter');
const os = require('os');

var platformMap={
  "darwin": "osx"
  
}


report.generate({
       metadata:{
        device: 'Local test machine',
        platform: {
            name: platformMap[os.platform()],
            version: os.release()
        }
       },
    customData: {
        title: 'Run info',
        data: [
            {label: 'Report Generated:', value: `${new Date()}` }
        ]
    },
	jsonDir: './test/report/', 
        reportPath: `test/report/`,
});

