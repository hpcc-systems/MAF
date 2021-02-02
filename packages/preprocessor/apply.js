var { Apply } = require('./dist/index.js')
    var fs=require('fs')
isGroup = function(group) { return function(row) { return group.toUpperCase() == row.group.toUpperCase(); } }

Apply('text from file {string}', function(file) {
    var content=fs.readFileSync(file, 'utf8')
    return content
})

Apply('run {string}', function(item) {
  eval(item)
  return null
})

var getJSONObjFromFile=async function(item) {
    var content=fs.readFileSync(item, 'utf8')
    var Papa = require('papaparse');
    var res=await Papa.parse(content, {
      header: true
    });
    var keyLength=Object.keys(res.data[0]).length
    res=res.data.filter(i=> Object.keys(i).length===keyLength)
    var last=res[res.length-1]
    var keys=Object.keys(last)
    var popit=true
    for(var i in keys) {
      if(last[keys]!== "") {
        popit=false;
      }
    }
    if(popit)
      res.pop()
    return res
}

Apply("JSON File {string}", async function(jsonItem) {
  return JSON.parse(fs.readFileSync(jsonItem))
})
Apply("PSV File {string}", getJSONObjFromFile)
Apply("CSV File {string}", getJSONObjFromFile)
/*
 *
  Return array:
   [ {phone: 1}, { phone: 2} ... ]
   [ { phone: 1, country: "us"}, {phone: 2, "country": "us"}]
 */
var combinations=function(obj) {
  // Go through the first key
  var keys=Object.keys(obj)
  var firstKey=keys[0]
  var firstObj=obj[keys[0]]
  var res=[]
  if(keys.length===1) {
    for(var i=0; i<firstObj.length; i++) {
      var newItem={}
      newItem[firstKey]=firstObj[i]
      res.push(newItem)
    }
    return res
  }
  var otherKeys=keys.slice(1, keys.length)
  var others={}
  otherKeys.forEach( i => {
    others[i]=obj[i]
  })
  for(var i=0; i<firstObj.length; i++) {
      var c=combinations(others)
      c.forEach(j => {
        j[firstKey]=firstObj[i]
        res.push(j)
      })
  }
  return res
}
Apply("combinations for json file {string}", async function(file) {
  var obj=JSON.parse(fs.readFileSync(file, 'utf8'))
  return combinations(obj)
})
Apply("combinations for json file {string} with filter {string}", async function(file, filter) {
  var obj=JSON.parse(fs.readFileSync(file, 'utf8'))
  return combinations(obj).filter(eval(filter))
})

Apply("CSV File {string} with filter {string}", async function(item, filterText) {
  return (await getJSONObjFromFile(item)).filter(eval(filterText))
})
