require('./apply')
var fs=require('fs')
var processLine=require('./processLine')
var gen=require('./gen')
async function run() {
  var file=fs.readFileSync('tmp.feature', 'utf8')
  var lines=file.split("\n")
  for(var i in lines) {
    var res=await processLine(lines[i])
    if(res===null) {
    }
    else if(typeof res==="object") {
      gen(res).forEach(i=> console.log(i))
    } else {
      if(res !== null)
      console.log(res)
    }
  }
}
run()
