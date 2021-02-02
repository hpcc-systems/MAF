var c=require('./getMatches')
async function run(step) {
  var a=c(step)[0]
  var expressions=a.expression.match(step).map(i=>i.group.value).map(JSON.parse)
  return await a.code(...expressions)
}
module.exports=run
