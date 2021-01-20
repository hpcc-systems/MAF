var userInfo=require('./userInfo')
var conn=async function (connectionInfo) {
  const { Client }=require('pg')
  let currConnInfo=connectionInfo
  var info=await userInfo("pgsql."+connectionInfo.host+ "."+connectionInfo.database)
  var client=new Client({
    ...currConnInfo,
    password: info.password,
    user: info.username
  }) 
  await client.connect()
  return client
}
module.exports=conn
