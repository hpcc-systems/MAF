const c = require('./getMatches')
async function run(step) {
    const a = c(step)[0]
    const expressions = a.expression.match(step).map(i => i.group.value).map(JSON.parse)
    return await a.code(...expressions)
}
module.exports = run
