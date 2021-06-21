// This file is made to use javascript to locally connect to localstack based on the ports supplied in the awsPortMap.json file
const ports = require('./awsPortMap')
const getHost = () => {
  return process.env.LOCALSTACKHOST === undefined ? 'localhost' : process.env.LOCALSTACKHOST
}

const AWSRun = function (args) {
  if (typeof args === 'string') {
    args = args.split(' ')
  }
  const port = ports[args[0]]
  if (process.env.AWSENV === undefined || process.env.AWSENV === '' || process.env.AWSENV.toUpperCase() === 'FALSE') {
    let argURL = `--endpoint-url=http://${getHost()}`
    if (process.env.USEPORTMAP) {
      argURL += `:${port}`
    }
    args.unshift(argURL)
  }
  const res = require('child_process').spawnSync('aws', args)
  if (res.status !== 0 || res.stdout.includes('Error:')) {
    const errorMessage = res.stderr.toString() + '\n' + res.stdout.toString()
    throw new EvalError(`ERROR command: aws ${args.join(' ')} failed...\n` + errorMessage)
  }
  const result = {
    stdout: res.stdout ? res.stdout.toString() : '',
    status: res.status
  }
  return result
}
module.exports = AWSRun
