const util = require('util')
const prompt = require('prompt')
const check = async function (environment, skipIfNotRequired = false) {
  if (process.env.USE_ENV_VARIABLES === 'TRUE') {
    return
  }
  const keytar = require('keytar')
  const hasPassword = async (service, account) => await keytar.getPassword(service, account) !== null
  const required = !(await hasPassword(environment, 'username'))
  const schema = {
    properties: {
      username: {
        description: `Please enter your username for the ${environment} environment`,
        pattern: /^[a-zA-Z\d_]+$/,
        message: 'Name must be only letters, underscore and digits',
        required
      },
      password: {
        description: 'Please enter your password',
        hidden: true
      }
    }
  }
  if (required === false && skipIfNotRequired) {
    return
  }
  const get = util.promisify(prompt.get)
  const result = await get(schema)
  //
  // Store the results.
  //
  if (result.username) {
    console.log('STROING USERNAME IN ENVIRONMENT ' + environment)
    await keytar.setPassword(environment, 'username', result.username)
    if (result.password) {
      await keytar.setPassword(environment, 'password', result.password)
    }
  }
}
module.exports = check
