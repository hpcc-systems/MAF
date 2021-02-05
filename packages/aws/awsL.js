//This file is made to use javascript to locally connect to localstack based on the ports supplied in the awsPortMap.json file
var ports = require('./awsPortMap')
var getHost = () => {
  return process.env.LOCALSTACKHOST === undefined ? "localhost" : process.env.LOCALSTACKHOST
}

var AWSRun = function (args) {
  if (typeof args === "string") {
    args = args.split(" ")
  }
  var port = ports[args[0]]
  if (process.env.AWSENV === undefined || process.env.AWSENV === "" || process.env.AWSENV.toUpperCase() === "FALSE") {
    args.unshift(`--endpoint-url=http://${getHost()}:${port}`)
  }
  var res = require('child_process').spawnSync("aws", args);
  if (res.status !== 0 || res.stdout.includes("Error:")) {
    var errorMessage = res.stderr.toString() + "\n" + res.stdout.toString()
    throw new EvalError(`ERROR command: aws ${args.join(" ")} failed...\n` + errorMessage)
  }
  var result = {
    stdout: res.stdout ? res.stdout.toString() : "",
    status: res.status
  }
  return result;
}
module.exports = AWSRun
