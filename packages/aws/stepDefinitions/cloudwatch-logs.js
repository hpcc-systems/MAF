const { setDefaultTimeout } = require('@cucumber/cucumber')
const { MAFWhen, filltemplate } = require('@ln-maf/core')
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs')
const { DateTime } = require('luxon')

setDefaultTimeout(15 * 60 * 1000)

const cloudwatchLogsClientConfig = { maxAttempts: 3 }
if (process.env.AWSENV === undefined || process.env.AWSENV === '' || process.env.AWSENV.toUpperCase() === 'FALSE') {
  cloudwatchLogsClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : 'http://localhost:4566'
}
const cloudwatchLogsClient = new CloudWatchLogsClient(cloudwatchLogsClientConfig)

/**
 * Returns at most 10 query calls of 1 MB / 10,000 logs from cloudwatch
 */
MAFWhen('cloudwatch logs from log group {string} from {int} minutes ago to now are retrieved', async function (logGroup, minutes) {
  const startTime = DateTime.now().minus({ minutes }).toUTC().toMillis()
  logGroup = filltemplate(logGroup, this.results)
  let logs = []
  let res = {}
  let queries = 0
  do {
    const queryParameters = {
      logGroupName: logGroup,
      startTime
    }
    if (res.nextToken) {
      queryParameters.nextToken = res.nextToken
    }
    res = await cloudwatchLogsClient.send(new FilterLogEventsCommand(queryParameters))
    logs = logs.concat(res.events.map(event => event.message.replace(/\t/g, '    ')))
  } while (res.nextToken && ++queries <= 10)
  return logs
})
