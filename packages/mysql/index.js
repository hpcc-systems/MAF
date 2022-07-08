const create = require('@ln-maf/default-sql')
const mysql = require('mysql2/promise')
create({
  name: 'mysql',
  connect: async (connectionInfo, username, password) => {
    const dets = {
      ...(connectionInfo),
      user: username,
      password
    }
    const connection = await mysql.createConnection(dets)
    await connection.execute('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;')
    return connection
  },
  runQuery: async (connection, query) => {
    const res = await connection.execute(query)
    return res[0]
  },
  disconnect: async (connection) => {
    await connection.end()
  }
})
