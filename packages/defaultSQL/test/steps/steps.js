var create=require('../../index')
create({
    name: "FAKE",
    connect: (username, password) => {

    },
    runQuery: (connection, query) =>  "I AM NOT SQL",
    disconnect: (connection)=>{}
})

const { Given } = require('@cucumber/cucumber');
Given('set environment variable {string} to {string}', function(str1, str2) {
    process.env[str1]=str2
})