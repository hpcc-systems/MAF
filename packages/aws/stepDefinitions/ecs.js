const runAWS = require('../awsL')
const { performJSONObjectTransform, MAFWhen, filltemplate } = require('@ln-maf/core')
const fillTemplate = filltemplate

function stringExists (list, string) {
  if (list && list.length === 0) {
    return false
  }
  return list.find(element => element.includes(string))
}

function taskDefinitionExists (taskDefinitionName) {
  const res = runAWS('ecs list-task-definitions --family-prefix ' + taskDefinitionName)
  const taskDefinitionList = JSON.parse(res.stdout).taskDefinitionArns
  return stringExists(taskDefinitionList, taskDefinitionName)
}

function clusterExists (clusterName) {
  const res = runAWS('ecs list-clusters')
  const clusterList = JSON.parse(res.stdout).clusterArns
  return stringExists(clusterList, clusterName)
}

MAFWhen('ecs taskDefinition {string} does not exist', function (taskDefinitionName) {
  taskDefinitionName = fillTemplate(taskDefinitionName, this.results)
  if (taskDefinitionExists(taskDefinitionName)) {
    throw new Error('ecs TaskDefinition  ' + taskDefinitionName + ' does exist')
  }
})

MAFWhen('ecs taskDefinition {string} exists', function (taskDefinitionName) {
  taskDefinitionName = fillTemplate(taskDefinitionName, this.results)
  if (!taskDefinitionExists(taskDefinitionName)) {
    throw new Error('ecs TaskDefinition  ' + taskDefinitionName + ' does not exist')
  }
})

MAFWhen('ecs cluster {string} does not exists', function (clusterName) {
  clusterName = fillTemplate(clusterName, this.results)
  if (clusterExists(clusterName)) {
    throw new Error('Cluster ' + clusterName + ' does exists')
  }
})

MAFWhen('ecs cluster {string} exists', function (clusterName) {
  clusterName = fillTemplate(clusterName, this.results)
  if (!clusterExists(clusterName)) {
    throw new Error('Cluster ' + clusterName + ' does not exist')
  }
})

/**
 * Runs an ecs-task
 * Required: taskDefinition, cluster
 * @param {Array} supported arguments for the aws ecs run-task
 * @param {Array} additionalArgs pairs of strings that will be added to the aws cli
 * @return {JSON} The response from aws ecs run-task
 */
function ecsRunTask (activeArgs, additionalArgs) {
  const ecsArgs = {}
  Object.assign(ecsArgs, this.results)
  Object.assign(ecsArgs, activeArgs)

  const args = ['ecs', 'run-task']
  if (!ecsArgs.taskDefinition) {
    throw new Error("The 'taskDefinition' for ecs run-task is required")
  }
  args.push('--task-definition', ecsArgs.taskDefinition)
  if (!ecsArgs.cluster) {
    throw new Error("The 'cluster' for ecs run-task is required since defaults are different for each account")
  }
  args.push('--cluster', ecsArgs.cluster)
  if (ecsArgs.networkConfiguration) {
    args.push(
      '--network-configuration',
      'awsvpcConfiguration={subnets=' + JSON.stringify(ecsArgs.networkConfiguration.subnets) + ',securityGroups=' + JSON.stringify(ecsArgs.networkConfiguration.securityGroups) + ',assignPublicIp=' + (ecsArgs.networkConfiguration.assignPublicIp ? ecsArgs.networkConfiguration.assignPublicIp : 'DISABLED') + '}'
    )
  }
  if (ecsArgs.enableECSManagedTags) {
    args.push('--enable-ecs-managed-tags')
  }
  args.push('--launch-type', ecsArgs.launchType ? ecsArgs.launchType : 'FARGATE')
  if (additionalArgs) {
    args.push(...additionalArgs)
  }
  return JSON.parse(runAWS(args).stdout)
}

/**
 * Extracts variables for ecs run-task and preforms the aws cli command
 * @param {JSON} payload an object containing keys / values for the run-task
 */
function performECSRunTaskFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = []
  Object.keys(payload).forEach((key) => {
    switch (key) {
      case 'taskDefinition':
        activeArgs[key] = payload[key]
        break
      case 'cluster':
        activeArgs[key] = payload[key]
        break
      case 'networkConfiguration':
        activeArgs[key] = payload[key]
        break
      case 'enableECSManagedTags':
        activeArgs[key] = payload[key]
        break
      default:
        additionalArgs.push('--' + key)
        additionalArgs.push(payload[key])
    }
  })
  return ecsRunTask.call(this, activeArgs, additionalArgs)
}

/**
 * Runs an ecs task from a provided JSONobject
 */
MAFWhen('ecs run-task from {jsonObject} is performed', function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  return performECSRunTaskFromJSON.call(this, payload)
})

/**
 * Performs an ecs task based on the provided docstring and variables defined in a document string
 */
MAFWhen('perform ecs run-task:', function (docString) {
  const payload = JSON.parse(fillTemplate(docString, this.results))
  return performECSRunTaskFromJSON.call(this, payload)
})

/**
 * Runs a new task based on existing items
 */
MAFWhen('ecs run-task is performed', function () {
  return ecsRunTask.call(this)
})

MAFWhen('ecs cluster {string} information is retrieved', function (clusterName) {
  clusterName = fillTemplate(clusterName, this.results)
  return JSON.parse(runAWS('ecs describe-clusters --cluster ' + clusterName).stdout).clusters
})
