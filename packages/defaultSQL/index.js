const { Given } = require('@cucumber/cucumber');
const { readFile } = require('@ln-maf/core')
const { MAFWhen, performJSONObjectTransform } = require('@ln-maf/core')


/*
 * To set this up we need to be able to run a query
*/
var setItUp=function(moduleInfo) {
  const { name, runQuery, connect, disconnect } = moduleInfo
  MAFWhen(name + ' query from {jsonObject} is run', async function(query) {
    var connectionInfo=eval(`this.results.${name}` + "ConnectionInfo")
    if(!connectionInfo) {
      connectionInfo=JSON.parse(readFile("./"+name+".sqlConfig.json",this))
    }
    var q=performJSONObjectTransform.call(this, query)
    var userInfoObtainer=require('./userInfo')
    var userInfo=await userInfoObtainer(`${name}.${connectionInfo.host}.${connectionInfo.database}`)
    var connection=await connect(connectionInfo, userInfo.username, userInfo.password)
    var res=await runQuery(connection, q)
    await disconnect(connection)
    return res
  })
  
  Given(name + ' config from {jsonObject}', function (string) {
    string=performJSONObjectTransform.call(this, string)
    eval(`this.results.${name}ConnectionInfo=string`)
  });
}
module.exports=setItUp
  
