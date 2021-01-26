var create=require('../../index')
create({
    name: "FAKE",
    connect: (username, password) => {},
    runQuery: (connection, query) =>  "I AM NOT SQL",
    disconnect: (connection)=>{}
})
