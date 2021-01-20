var keytar=require('keytar')
var clear=async function(environment) {
        keytar.deletePassword(environment, "username")
        keytar.deletePassword(environment, "password")
}
module.exports=clear
