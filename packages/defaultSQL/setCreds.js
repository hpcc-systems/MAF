#!/usr/bin/env node
async function setEm () {
  const args = process.argv.slice(2)
  const fs = require('fs')
  const config = fs.readFileSync(args[0], 'utf8')
  const environment = 'sql.' + config.host + '.' + config.database
  const keytar = require('keytar')
  await keytar.setPassword(environment, 'username', args[1])
  await keytar.setPassword(environment, 'password', args[2])
}
setEm()
