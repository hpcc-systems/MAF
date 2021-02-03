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
    return { username: process.env[environment + '_SQL_USERNAME'], password: process.env[environment + '_SQL_PASSWORD'] }
  }
}
module.exports = getCreds
