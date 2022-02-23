const runAWS = require('../awsL')
const Cucumber = require('@cucumber/cucumber')
const Given = Cucumber.Given
const { performJSONObjectTransform, MAFWhen, filltemplate } = require('@ln-maf/core')
const fillTemplate = filltemplate

MAFWhen('run task {string}', function (taskDefinition) {
  runTask(taskDefinition)
})

/**
 * Runs an existing task on elastic container service
 * @param {Array} additionalArgs pairs of strings that will be added to the aws cli
 * @return {JSON} The task information
 */
function runTask (taskDefinition, additionalArgs) {
  const args = ['ecs', 'run-task']
  if (!taskDefinition || taskDefinition === '') {
    throw new Error("The 'taskDefinition' for ecs run-task is required")
  }
  if (additionalArgs) {
    args.push(...additionalArgs)
  }
  this.attach(`Query: ${args}`)
  this.results.lastRun = JSON.parse(runAWS(args).stdout.toString())
  this.attach(JSON.stringify({ lastRun: this.results.lastRun }, null, 2))
}

Given('ECS TaskDefinition {string} does not exists', function (taskDefinition) {
  if (taskDefinitionExists(taskDefinition)) {
    throw new Error('ECS Task Definition  ' + taskDefinition + ' does exists')
  }
})

Given('ECS TaskDefinition {string} exists', function (taskdefin) {
  if (!taskDefinitionExists(taskdefin)) {
    throw new Error('ECS Task Definition  ' + taskdefin + ' does not exist')
  }
})

Given('Cluster {string} exists', function (clusterName) {
  if (!clusterExists(clusterName)) {
    throw new Error('Cluster ' + clusterName + ' does not exists.')
  }
})

Given('Cluster {string} does not exists', function (clusterName) {
  if (clusterExists(clusterName)) {
    throw new Error('Cluster ' + clusterName + ' does exists.')
  }
})

MAFWhen('Registered TaskDefinition {string} is retrieved', function (taskFamilyName) {
  const res = runAWS('ecs list-task-definitions --sort DESC --profile ' + profile + ' --family-prefix ' + taskFamilyName + ' ')
  const response = JSON.parse(res.stdout)
  return response.taskDefinitionArns

})
MAFWhen('a new ecs task for {string} taskDefinition for version {string} is executed in cluster {string} with FARGATE as launch-type having {string} subnets and {string} subgroups', function (taskDef, version, clusterName, subnets, subgroups) {
  const res = runAWS('ecs run-task --cluster ' + clusterName + ' --task-definition ' + taskDef + ':' + version + ' --profile ' + profile + '  --launch-type FARGATE --enable-ecs-managed-tags --network-configuration awsvpcConfiguration={subnets=[' + subnets + '],securityGroups=[' + subgroups + '],assignPublicIp=DISABLED}')
  const response = JSON.parse(res.stdout)
  return get_new_created_task_Arns(response.tasks)
})

MAFWhen('perform ecs task with {jsonObject}', function (json) {
  let payload = performJSONObjectTransform.call(this, json)

  if (!checkReqParams(payload)) {
    return new Error("Missing attribute in payload.")
  }
  if (!payload.hasOwnProperty('launch-type') && isEmpty(payload.launch - type)) {
    payload['launch-type'] = "FARGATE"
  }

  if (!payload.hasOwnProperty('assignPublicIp') && isEmpty(payload.assignPublicIp)) {
    payload['assignPublicIp'] = "DISABLED"
  }
  else {
    payload['assignPublicIp'] = "ENABLED" === payload.assignPublicIp ? "ENABLED" : "DISABLED"
  }
  if (!payload.hasOwnProperty('profile') || isEmpty(payload['profile'])) {
    payload['profile'] = "default"
  }

  payload['securityGroups'] = payload.securityGroups.join()
  payload['subnets'] = payload.subnets.join()

  const res = runAWS('ecs run-task --cluster ' + payload['clusterName'] +
    ' --profile ' + payload['profile'] +
    ' --task-definition ' + payload['task-definition'] + ':' + payload['taskDefVersion'] +
    ' --launch-type ' + payload['launch-type'] +
    ' --enable-ecs-managed-tags' +
    ' --network-configuration awsvpcConfiguration={subnets=[' + payload['subnets'] + '],securityGroups=[' + payload['securityGroups'] + '],assignPublicIp=' + payload['assignPublicIp'] + '}')

  const response = JSON.parse(res.stdout)
  return get_new_created_task_Arns(response.tasks)
})

MAFWhen('Cluster {string} is retrieved', function (clusterName) {
  return describeActiveCluster(clusterName);
})

function get_new_created_task_Arns(tasksRes) {
  let newTaskName = null;
  let resp = {}
  if (undefined !== tasksRes && 0 !== tasksRes.length) {
    newTaskName = tasksRes[0].taskArn
  }
  if (!isEmpty(newTaskName) && undefined !== tasksRes[0].containers && 0 !== tasksRes[0].containers) {
    for (let i = 0; i < tasksRes[0].containers.length; i++) {
      if (newTaskName === tasksRes[0].containers[i].taskArn) {
        resp.taskArn = newTaskName
        resp.taskLastStatus = tasksRes[0].lastStatus
        resp.desiredStatus = tasksRes[0].desiredStatus
        resp.containerStatus = tasksRes[0].containers[i].lastStatus
        break
      }
    }
  }
  return resp
}
function checkReqParams(payload) {
  const reqAttributes = ["task-definition", "taskDefVersion", "clusterName"]
  for (var i = 0; i < reqAttributes.length; i++) {
    if (!payload.hasOwnProperty(reqAttributes[i]) || isEmpty(payload[reqAttributes[i]])) {
      console.error('No key ' + reqAttributes[i] + ' or value exists in payload.')
      return false
    }
  }
  return true
}

function taskDefinitionExists(taskdef) {
  const res = runAWS('ecs list-task-definitions --sort DESC --family-prefix ' + taskdef)
  const taskDefinitionList = JSON.parse(res.stdout)
  const data = taskDefinitionList.taskDefinitionArns
  if (taskDefinitionList.taskDefinitionArns && taskDefinitionList.taskDefinitionArns === 0) {
    return false
  }
  let isExists = false
  for (let step = 0; data.length; i++) {
    const taskIndividual = data[step].split(':task-definition/')
    const itask = taskIndividual[1].split(':');
    if (taskdef === itask[0].trim()) {
      isExists = true
      break
    }
  }
  return isExists
}

function isEmpty(str) {
  return (!str || 0 === str.length);
}

function clusterExists(clusterName) {
  const res = runAWS('ecs list-clusters --profile ' + profile)
  const response = JSON.parse(res.stdout)
  for (let i = 0; i < response.clusterArns.length; i++) {
    let clusterSplit = response.clusterArns[i].split(":cluster/")
    if (clusterSplit.length > 0 && clusterName === clusterSplit[1]) {
      return true
    }
  }
  return false
}
function describeActiveCluster(clusterName) {
  const res = runAWS('ecs describe-clusters --profile ' + profile + ' --cluster ' + clusterName)
  let response = JSON.parse(res.stdout)
  let filterRes = response.clusters.filter(item => 'ACTIVE' === item.status && clusterName === item.clusterName)
  let data = {}
  if (filterRes.length > 0) {
    data.cluster = filterRes[0].clusterName
    data.status = filterRes[0].status
  } else {
    data.cluster = clusterName
    data.status = "MISSING"
  }
  return data
}
