const { setDefaultTimeout } = require('@cucumber/cucumber')
const { MAFWhen, performJSONObjectTransform, fillTemplate } = require('@ln-maf/core')
const { ECSClient, ListTaskDefinitionsCommand, ListClustersCommand, RunTaskCommand, DescribeClustersCommand, DescribeServicesCommand, DescribeTaskDefinitionCommand } = require('@aws-sdk/client-ecs')

setDefaultTimeout(15 * 60 * 1000)

const ecsClientConfig = { maxAttempts: 3 }
if (process.env.AWSENV && process.env.AWSENV.toUpperCase() === 'LOCALSTACK') {
    ecsClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : 'http://localhost:4566'
    ecsClientConfig.region = 'us-east-1'
    ecsClientConfig.credentials = {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
}
const ecsClient = new ECSClient(ecsClientConfig)

/**
 * lists ECS task definitions by family prefix
 * @param {string} taskDefinitionFamilyPrefix the task definition name
 * @returns {string[]} an array matching the task definition
 */
async function listTaskDefinitions(taskDefinitionFamilyPrefix) {
    let taskDefinitionARNs = []
    let res = {}
    do {
        const queryParameters = {
            familyPrefix: taskDefinitionFamilyPrefix
        }
        if (res.nextToken) {
            queryParameters.nextToken = res.nextToken
        }
        res = await ecsClient.send(new ListTaskDefinitionsCommand(queryParameters))
        taskDefinitionARNs = taskDefinitionARNs.concat(res.taskDefinitionArns)
    } while (res.nextToken)
    return taskDefinitionARNs
}

MAFWhen('ecs taskDefinition {string} does not exist', async function (taskDefinitionName) {
    taskDefinitionName = fillTemplate(taskDefinitionName, this.results)
    const taskDefinitionARNs = await listTaskDefinitions(taskDefinitionName)
    if (taskDefinitionARNs.some(arn => arn.includes(taskDefinitionName))) {
        throw new Error('ecs TaskDefinition ' + taskDefinitionName + ' does exist')
    }
})

MAFWhen('ecs taskDefinition {string} exists', async function (taskDefinitionName) {
    taskDefinitionName = fillTemplate(taskDefinitionName, this.results)
    const taskDefinitionARNs = await listTaskDefinitions(taskDefinitionName)
    if (!taskDefinitionARNs.some(arn => arn.includes(taskDefinitionName))) {
        throw new Error('ecs TaskDefinition ' + taskDefinitionName + ' does not exist')
    }
})

/**
 * lists all ECS clusters on AWS
 * @returns {string[]} an array listing clusters
 */
async function listClusters() {
    let clusters = []
    let res = {}
    do {
        const queryParameters = {}
        if (res.nextToken) {
            queryParameters.nextToken = res.nextToken
        }
        res = await ecsClient.send(new ListClustersCommand(queryParameters))
        clusters = clusters.concat(res.clusterArns)
    } while (res.nextToken)
    return clusters
}

MAFWhen('ecs clusters from AWS are retrieved', async function () {
    return await listClusters()
})

MAFWhen('ecs cluster {string} does not exist', async function (clusterName) {
    clusterName = fillTemplate(clusterName, this.results)
    const clusterARNs = await listClusters()
    if (clusterARNs.some(arn => arn.includes(clusterName))) {
        throw new Error('ECS cluster ' + clusterName + ' does exist')
    }
})

MAFWhen('ecs cluster {string} exists', async function (clusterName) {
    clusterName = fillTemplate(clusterName, this.results)
    const clusterARNs = await listClusters()
    if (!clusterARNs.some(arn => arn.includes(clusterName))) {
        throw new Error('ECS cluster ' + clusterName + ' does not exist')
    }
})

/**
 * Gets the ARN of an ECS cluster by its name
 * @param {string} clusterName the name of the cluster to find
 * @returns {string|undefined} the cluster ARN if found, undefined otherwise
 */
async function getClusterARNFromName(clusterName) {
    const clusterARNs = await listClusters()
    return clusterARNs.find(arn => arn.includes(clusterName))
}

MAFWhen('get ARN of ecs cluster {string}', async function (clusterName) {
    clusterName = fillTemplate(clusterName, this.results)
    const name = await getClusterARNFromName(clusterName)
    if (!name) {
        throw new Error('ECS cluster ' + clusterName + ' can not be found on AWS')
    }
    return name
})

MAFWhen('information from ecs cluster {string} is retrieved', async function (clusterName) {
    clusterName = fillTemplate(clusterName, this.results)
    const name = await getClusterARNFromName(clusterName)
    if (!name) {
        throw new Error('ECS cluster ' + clusterName + ' can not be found on AWS')
    }
    const queryParameters = {
        clusters: [name],
        include: ['CONFIGURATIONS', 'SETTINGS']
    }
    return await ecsClient.send(new DescribeClustersCommand(queryParameters))
})

/**
 * Runs an ecs task on an AWS ECS cluster
 * @param {Object} activeArgs supported arguments for the AWS RunTaskCommand
 * @param {Object} additionalArgs unsupported pairs of other attributes for AWS RunTaskCommand
 * @return {Object} RunTaskCommandOutput (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ecs/interfaces/runtaskcommandoutput.html)
 */
async function ecsRunTask(activeArgs, additionalArgs) {
    const ecsRunTaskArgs = {}
    Object.assign(ecsRunTaskArgs, this.results)
    Object.assign(ecsRunTaskArgs, activeArgs)

    let queryParameters = {}

    if (!ecsRunTaskArgs.taskDefinition) {
        throw new Error("The 'taskDefinition' for ecs run-task is required")
    }
    queryParameters.taskDefinition = ecsRunTaskArgs.taskDefinition

    if (!ecsRunTaskArgs.cluster) {
        throw new Error("The 'cluster' for ecs run-task is required since defaults are different for each account")
    }
    queryParameters.cluster = ecsRunTaskArgs.cluster
    if (ecsRunTaskArgs.networkConfiguration) {
        queryParameters.networkConfiguration = ecsRunTaskArgs.networkConfiguration
    }
    if (ecsRunTaskArgs.enableECSManagedTags) {
        queryParameters.enableECSManagedTags = ecsRunTaskArgs.enableECSManagedTags
    } else {
        queryParameters.enableECSManagedTags = false
    }
    queryParameters.launchType = ecsRunTaskArgs.launchType ? ecsRunTaskArgs.launchType : 'FARGATE'
    if (additionalArgs) {
        queryParameters = { ...queryParameters, ...additionalArgs }
    }
    this.attach(JSON.stringify(queryParameters))
    return await ecsClient.send(new RunTaskCommand(queryParameters))
}

/**
 * Extracts variables for ecs run-task and performs the aws cli command
 * @param {Object} payload an object containing keys / values for the run-task
 * @return {Object} RunTaskCommandOutput
 */
async function performECSRunTaskFromJSON(payload) {
    const activeArgs = {}
    const additionalArgs = {}
    Object.keys(payload).forEach((key) => {
        switch (key) {
        case 'taskDefinition':
        case 'cluster':
        case 'networkConfiguration':
        case 'enableECSManagedTags':
            activeArgs[key] = payload[key]
            break
        default:
            additionalArgs[key] = payload[key]
        }
    })
    return await ecsRunTask.call(this, activeArgs, additionalArgs)
}

/**
 * Runs an ecs task from a provided JSON object
 * @param {Object} payload the JSON object containing task parameters
 * @return {Object} RunTaskCommandOutput
 */
MAFWhen('ecs run-task from {jsonObject} is performed', async function (payload) {
    payload = performJSONObjectTransform.call(this, payload)
    return performECSRunTaskFromJSON.call(this, payload)
})

/**
 * Performs an ecs task based on the provided docstring and variables defined in a document string
 * @param {string} docString JSON string containing task parameters
 * @return {Object} RunTaskCommandOutput
 */
MAFWhen('perform ecs run-task:', async function (docString) {
    const payload = JSON.parse(fillTemplate(docString, this.results))
    return await performECSRunTaskFromJSON.call(this, payload)
})

/**
 * Runs a new task based on existing items
 * @return {Object} RunTaskCommandOutput
 */
MAFWhen('ecs run-task is performed', async function () {
    return await ecsRunTask.call(this)
})

/**
 * Check that at least one task for a service is running
 * Returns the number of running tasks
 * @param {string} serviceName the name of the service
 * @param {string} clusterName the name of the cluster
 * @return {number} the number of running tasks
 */
MAFWhen('at least one task is running for service {string} in cluster {string}', async function (serviceName, clusterName) {
    serviceName = fillTemplate(serviceName, this.results)
    clusterName = fillTemplate(clusterName, this.results)
    const serviceDetails = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName]
    }))
    if (serviceDetails.services.length === 0) {
        throw new Error('Cannot find service ' + serviceName + ' in cluster ' + clusterName)
    }
    const runningCount = serviceDetails.services[0].runningCount
    if (runningCount < 1) {
        throw new Error('Service ' + serviceName + ' is not currently running in cluster ' + clusterName)
    }
    return runningCount
})

/**
 * Retrieves the image name / version of the running task in the service
 * Fails if the service is not running, or if there are no tasks running
 * @param {string} serviceName the name of the service
 * @param {string} clusterName the name of the cluster
 * @return {string} the container image name
 */
MAFWhen('image name for service {string} in cluster {string} is retrieved', async function (serviceName, clusterName) {
    serviceName = fillTemplate(serviceName, this.results)
    clusterName = fillTemplate(clusterName, this.results)
    const serviceDetails = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName]
    }))
    if (serviceDetails.services.length === 0) {
        throw new Error('Cannot find service ' + serviceName + ' in cluster ' + clusterName)
    }
    if (serviceDetails.services[0].runningCount <= 0) {
        throw new Error('Service ' + serviceName + ' is not currently running in cluster ' + clusterName)
    }
    const taskDefinitionDetails = await ecsClient.send(new DescribeTaskDefinitionCommand({ taskDefinition: serviceDetails.services[0].taskDefinition }))
    if (!taskDefinitionDetails.taskDefinition || !taskDefinitionDetails.taskDefinition.containerDefinitions || taskDefinitionDetails.taskDefinition.containerDefinitions.length === 0) {
        throw new Error('No container definitions found for service ' + serviceName + ' in cluster ' + clusterName)
    }
    const containerImageName = taskDefinitionDetails.taskDefinition.containerDefinitions[0].image
    return containerImageName
})
