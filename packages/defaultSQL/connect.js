const userInfo = require('./userInfo')
const conn = async function (connectionInfo) {
  const { Client } = require('pg')
  const currConnInfo = connectionInfo
  const info = await userInfo('pgsql.' + connectionInfo.host + '.' + connectionInfo.database)
  const client = new Client({
    ...currConnInfo,
    password: info.password,
    user: info.username
  })
  await client.connect()
  return client
}
module.exports = conn
