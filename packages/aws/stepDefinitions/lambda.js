const { setDefaultTimeout } = require('@cucumber/cucumber')
const { MAFWhen, performJSONObjectTransform, fillTemplate } = require('@ln-maf/core')
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

setDefaultTimeout(15 * 60 * 1000)

const lambdaClientConfig = { maxAttempts: 3 }
if (process.env.AWSENV && process.env.AWSENV.toUpperCase() === 'LOCALSTACK') {
    lambdaClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : 'http://localhost:4566'
    lambdaClientConfig.region = 'us-east-1'
    lambdaClientConfig.credentials = {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
}
const lambdaClient = new LambdaClient(lambdaClientConfig)

MAFWhen('a user supplies {jsonObject} to endpoint {string}', async function (payload, functionName) {
    functionName = fillTemplate(functionName, this.results)
    payload = performJSONObjectTransform.call(this, payload)
    const queryParameters = {
        FunctionName: functionName,
        Payload: payload
    }
    const response = await lambdaClient.send(new InvokeCommand(queryParameters))

    // Convert Payload from Uint8Array to string if it exists
    if (response.Payload) {
        const decoder = new TextDecoder()
        response.Payload = decoder.decode(response.Payload)
    }

    return response
})
