var keytar=require('./syncKeytar')
var getCreds=function(environment) {
  var username=keytar.getPassword(environment, "username")
  var password=keytar.getPassword(environment, "password")
  return { username, password }
}
module.exports= getCreds

