const util = require('util');
var prompt=require('prompt')
var check=async function(environment, skipIfNotRequired=false) {
  if(process.env.USE_ENV_VARIABLES === "TRUE") {
     return
   }
  var keytar=require('keytar')
  var hasPassword=async (service, account)=>await keytar.getPassword(service, account)!==null
  var required=!(await hasPassword(environment, "username"))
  var schema = {
    properties: {
      username: {
        description: `Please enter your username for the ${environment} environment`,
        pattern: /^[a-zA-Z\d_]+$/,
        message: 'Name must be only letters, underscore and digits',
        required
      },
      password: {
        description: "Please enter your password",
        hidden: true
      }
    }
  };
  if(required===false && skipIfNotRequired) {
    return
  }
  var get=util.promisify(prompt.get)
  var result=await get(schema)
  //
  // Store the results.
  //
  if(result.username) {
    console.log("STROING USERNAME IN ENVIRONMENT " + environment)
    await keytar.setPassword(environment, "username", result.username)
    if(result.password) {
      await keytar.setPassword(environment, "password", result.password)
    }
  }
}
module.exports=check
