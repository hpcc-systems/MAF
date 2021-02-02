async function run() {
var c=require('./getMatches')
var step='CSV File "bla.csv"'
var a=c(step)[0]
var expressions=a.expression.match(step).map(i=>i.group.value).map(JSON.parse)
await a.code(...expressions)
}
run()
