require('./apply')
const fs = require('fs')
const processLine = require('./processLine')
const gen = require('./gen')
async function run () {
  const file = fs.readFileSync('tmp.feature', 'utf8')
  const lines = file.split('\n')
  for (const i in lines) {
    const res = await processLine(lines[i])
    if (res !== null) {
      if (typeof res === 'object') {
        gen(res).forEach(i => console.log(i))
      } else {
        console.log(res)
      }
    }
  }
}
run()
