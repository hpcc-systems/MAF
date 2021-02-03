var fs=require('fs')
fs.readFileSync('./package.json', 'utf8')
var a=require('./package.json')
a.repository= { "type": "git",
    "url": "git+https://github.com/hpcc-systems/MAF.git"
  }
a.keywords=
  [
    "cucumber-js",
    "testing",
    "cucumber-steps",
    "gherkin"
  ]
a.bugs= {
    "url": "https://github.com/hpcc-systems/MAF/issues"
  }
a.homepage="https://github.com/hpcc-systems/MAF#readme"
console.log(a)

fs.writeFileSync('./package.json', JSON.stringify(a, null,2), 'utf8')
