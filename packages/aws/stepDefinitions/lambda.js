const runAWS = require('../awsL')
const { MAFWhen, performJSONObjectTransform } = require('@ln-maf/core')
const fs = require('fs')
MAFWhen('a user supplies {jsonObject} to endpoint {string}', function (payload, functionName) {
  payload = JSON.stringify(performJSONObjectTransform.call(this, payload))
  // Write code here that turns the phrase above into concrete actions
  runAWS(`lambda invoke --function-name ${functionName} --payload '${payload}' lambdaTMPOutFile.txt`)
  return JSON.parse(fs.readFileSync('lambdaTMPOutFile.txt', 'utf8'))
})
