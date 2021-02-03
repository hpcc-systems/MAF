const create = require('@ln-maf/default-sql')
const Mysql = require('sync-mysql')
create({
  name: 'mysql',
  connect: async (connectionInfo, username, password) => {
    const dets = {
      ...(connectionInfo),
      user: username,
      password: password
    }
    const connection = new Mysql(dets)
    connection.query('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;')
    return connection
  },
  runQuery: async (connection, query) => {
    return connection.query(query)
  },
  disconnect: async (connection) => {
    connection.dispose()
  }
})
