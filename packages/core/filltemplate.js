
const fillTemplate = function(templateString, templateVars){
  //Check if the template string is a json object
  var isJSON=true
  try {
    var tmp=JSON.parse(templateString)
  } catch(e) {
    isJSON=false
  } 
  templateVars.random=Math.floor(Math.random()*100000)
  if(typeof templateString !== "string") {
    templateString=JSON.stringify(templateString, null, 2)
  }
  // Get all the items between the curly braces.
  var left=[]
  var prev=false
  var retStr=""
  var append=function(c) {
    if(left.length==0) {
      retStr+=c
    } else {
      left[left.length-1].str+=c
    }
  }
  templateVars.require=require
  var keys=Object.keys(templateVars)
  var vals=Object.values(templateVars)
  for(var i=0; i<templateString.length; i++) {
     var c=templateString.charAt(i)
     if(c=='{') {
       var item={
         index: i,
         str: ""
       }
       if(prev) {
         item.var=true
       } 
       // If we have no items to replace the bracket should be treated as a character 
       if(left.length==0 && !prev) {
         append(c)
       } else {
         left.push(item)
       }
       prev=false
       continue
     } else if(c=='}') {
       if(left.length!=0) {
         var l=left.pop()
         if(l.var) {
           // Use the provided string to process
           var str=l.str
           str=str.trim()
           var res=(new Function(...keys,  "return "+str +";"))(...vals)
           var ret=res
           if((typeof res === "string" && isJSON) || typeof res === "object")
             ret=JSON.stringify(res, null, 2)
           if(isJSON && typeof res === "string" && ret.length>1 && ret[0]==="\"" && ret[ret.length-1] === "\"") {
             ret=ret.substring(1, ret.length-1);
           }
           append(ret)
         } else { 
           append('{' + l.str + '}')
         }
       } else {
         append(c)
       }
       prev=false
       continue;
     } else {
       if(prev) {
         append('$')
       }
       if(c!='$') {  
         append(c)
       }
       prev= (c=='$') 
     }
  }
  while(left.length!=0) {
    var l=left.shift()
    if(l.var) {
      retStr+='$'
    }
    retStr+='{'+l.str
  }
  return retStr
}
module.exports=fillTemplate
