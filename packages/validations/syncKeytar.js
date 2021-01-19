const keytar = require('keytar')
const deasync=require('deasync')
var createSync=function(asyncF) {
  var done=false;
  var err
  var res
  var asyncFunction=async function() {
    try {
      res=await asyncF()
    } catch(e) {
      err = e
    }
    done=true
  }
  asyncFunction()
  require('deasync').loopWhile(function(){return !done;});
  if(err !== undefined) { 
    throw err
  }
  return res
}
var getPassword=function(service, account) {
  var f=async function() {
    return await keytar.getPassword(service, account)
  }
  return createSync(f)
}
var setPassword=function(service, account, password) {
  var f=async function() {
    return await keytar.setPassword(service, account, password)
  }
  return createSync(f)
}
var deletePassword=function(service, account) {
  var f=async function() {
    return await keytar.deletePassword(service, account)
  }
  return createSync(f)
}
var hasPassword=function(service, account) {
  var f=async function() {
    return await keytar.getPassword(service, account)!==null
  }
  return createSync(f)
}
module.exports={hasPassword, getPassword, setPassword, deletePassword}
