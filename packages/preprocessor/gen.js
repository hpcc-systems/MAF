
var pipeIt=(jsonStrArr) => {
  return "|  " + jsonStrArr.join("\t|  ") + "\t|" 
}
// The keys must be the same length
function generateFromJsonObjArray (jsonObj) {
  var res=[]
  var keys=Object.keys(jsonObj)
  res.push(pipeIt(keys))
  // We assume all keys are the same length
  var l=jsonObj[keys[0]].length
  var itemList=[]
  for(var i=0; i<l; i++) {
    var row=[]
    for(var key in keys) {
      var item=keys[key]
      row.push(jsonObj[item][i])
    }
    itemList.push(pipeIt(row))
  }
  itemList.forEach(i=>res.push(i))
  return res
}
function generateFromJSONArray(jsonArr) {
  return [pipeIt(Object.keys(jsonArr[0])), ...jsonArr.map(Object.values).map(pipeIt)]
}
//(generateFromJsonObjArray(jsonObj2)).forEach(i=>console.log(i))

//generateFromJSONArray(base).forEach(i=>console.log(i))
module.exports=generateFromJSONArray
