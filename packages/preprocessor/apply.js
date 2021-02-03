const { Apply } = require('./dist/index.js')
const fs = require('fs')
// eslint-disable-next-line no-unused-vars
const isGroup = function (group) { return function (row) { return group.toUpperCase() === row.group.toUpperCase() } }

Apply('text from file {string}', function (file) {
  const content = fs.readFileSync(file, 'utf8')
  return content
})

Apply('run {string}', function (item) {
  eval(item)
  return null
})

const getJSONObjFromFile = async function (item) {
  const content = fs.readFileSync(item, 'utf8')
  const Papa = require('papaparse')
  let res = await Papa.parse(content, {
    header: true
  })
  const keyLength = Object.keys(res.data[0]).length
  res = res.data.filter(i => Object.keys(i).length === keyLength)
  return res
}

Apply('JSON File {string}', async function (jsonItem) {
  return JSON.parse(fs.readFileSync(jsonItem))
})
Apply('PSV File {string}', getJSONObjFromFile)
Apply('CSV File {string}', getJSONObjFromFile)
/*
 *
  Return array:
   [ {phone: 1}, { phone: 2} ... ]
   [ { phone: 1, country: "us"}, {phone: 2, "country": "us"}]
 */
const combinations = function (obj) {
  // Go through the first key
  const keys = Object.keys(obj)
  const firstKey = keys[0]
  const firstObj = obj[keys[0]]
  const res = []
  if (keys.length === 1) {
    for (let i = 0; i < firstObj.length; i++) {
      const newItem = {}
      newItem[firstKey] = firstObj[i]
      res.push(newItem)
    }
    return res
  }
  const otherKeys = keys.slice(1, keys.length)
  const others = {}
  otherKeys.forEach(i => {
    others[i] = obj[i]
  })
  for (let i = 0; i < firstObj.length; i++) {
    const c = combinations(others)
    c.forEach(j => {
      j[firstKey] = firstObj[i]
      res.push(j)
    })
  }
  return res
}
Apply('combinations for json file {string}', async function (file) {
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'))
  return combinations(obj)
})
Apply('combinations for json file {string} with filter {string}', async function (file, filter) {
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'))
  return combinations(obj).filter(eval(filter))
})

Apply('CSV File {string} with filter {string}', async function (item, filterText) {
  return (await getJSONObjFromFile(item)).filter(eval(filterText))
})
