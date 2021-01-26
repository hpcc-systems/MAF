#!/usr/bin/env node
var fs=require('fs')
var prompt=require('prompt')
var cc=require('./checkCredentials')
var func=async function(name) {
  if(process.argv[2]) {
    var config=JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'))
    cc(name+"."+config.host+"."+config.database)
    return
  }
  var schema = {
    properties: {
    host: {
      description: `Please enter the host you would like to access in ${name} sql`,
      required: true
    }, 
    port: {
      description: `Please enter the port you would like to connect to`,
      pattern: /^[\d]+$/,
      message: 'Can only be digits',
      required: true
    },
    database: {
      description: `Please enter the database you are using`,
      required: true
    }
  }
  }
  prompt.get(schema, function(err, result) {
    if(result) {
      fs.writeFileSync(name+".sqlConfig.json", JSON.stringify(result, null, 2))
      cc(name+"."+result.host+"."+result.database)
    }
  })

}
module.exports=func
