async function run() {
    const c = require('./getMatches')
    const step = 'CSV File "bla.csv"'
    const a = c(step)[0]
    const expressions = a.expression.match(step).map(i => i.group.value).map(JSON.parse)
    await a.code(...expressions)
}
run()
