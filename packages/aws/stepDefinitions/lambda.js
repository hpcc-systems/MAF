var chai=require('chai')
var assert=chai.assert;
var runAWS = require('../awsL')
const { getFilePath, performJSONObjectTransform } = require('@ln-maf/core')


const { Given, When, Then } = require('@cucumber/cucumber')
var results={}

When('a user supplies {jsonObject} to endpoint {string}', function (payload, functionName) {
  var payload=JSON.stringify(performJSONObjectTransform.call(this, payload))
           // Write code here that turns the phrase above into concrete actions
  runAWS(`lambda invoke --function-name ${functionName} --payload '${payload}' lambdaTMPOutFile.txt`)
  this.results.lastRun=JSON.parse(fs.readFileSync('lambdaTMPOutFile.txt', 'utf8'))
  this.attach(JSON.stringify(this.results.lastRun, null, 2))
});


