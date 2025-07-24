
const pipeIt = (jsonStrArr) => {
    return '|  ' + jsonStrArr.join('\t|  ') + '\t|'
}

function generateFromJSONArray(jsonArr) {
    return [pipeIt(Object.keys(jsonArr[0])), ...jsonArr.map(Object.values).map(pipeIt)]
}
module.exports = generateFromJSONArray
