var getCreds=async function(environment) {
  if(process.env.USE_ENV_VARIABLES !== "TRUE")  {
    var keytar=require('keytar')
    var username=await keytar.getPassword(environment, "username")

    try {
    var password=await keytar.getPassword(environment, "password")
    } catch(e) {
      password=""
    }
  return { username, password }
  } else {
    return { username: process.env[environment+"_SQL_USERNAME"], password: process.env[environment+"_SQL_PASSWORD"]}
  }
}
module.exports= getCreds

