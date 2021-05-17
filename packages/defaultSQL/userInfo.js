const getCreds = async function (environment) {
  if (process.env.USE_ENV_VARIABLES !== 'TRUE') {
    const keytar = require('keytar')
    const username = await keytar.getPassword(environment, 'username')
    let password = await keytar.getPassword(environment, 'password')
    if (!password) {
      password = ''
    }
    return { username, password }
  } else {
    const dbName = /^[^\.]*/.exec(environment)[0].toUpperCase()
    return { username: process.env[dbName + '_SQL_USERNAME'], password: process.env[dbName + '_SQL_PASSWORD'] }
  }
}
module.exports = getCreds
