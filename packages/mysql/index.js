var create=require('@ln-maf/default-sql')
var mysql=require('sync-mysql')
create({
    name: "mysql",
    connect: async (connectionInfo, username, password) => {
        var dets= {...(connectionInfo),
        user: username,
        password: password
        }
        var connection=new mysql(dets)
        connection.query('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;')
        return connection

    },
    runQuery: async (connection, query) =>  {
        return connection.query(query)
    },
    disconnect: async (connection)=>{
        connection.dispose()
    }
})
