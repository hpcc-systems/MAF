#!/usr/bin/env node
async function setEm() {
  var args=process.argv.slice(2)
  var fs=require('fs')
  var config=fs.readFileSync(args[0], 'utf8')
  var environment="sql."+config.host+"."+config.database
  var keytar=require('keytar')
  await keytar.setPassword(environment, "username", args[1])
  await keytar.setPassword(environment, "password", args[2])
}
setEm()

