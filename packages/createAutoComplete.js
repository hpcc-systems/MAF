var textReplace=function(text) {
    var lines=text.split("\n")    
    var keywords=["Given", "When", "Then", "MAFWhen"]
    return ["const { When, Given, Then } = require('@cucumber/cucumber');",
        ...lines.map(i=>i.trim()).filter(i=>{
          i=i.split("(")[0]
          return keywords.includes(i)
        }).map(i=>i.replace("MAFWhen", "When")).map(
          i=>i.replace(/,.*/, ')')
        )
    ]
  }
const fs=require('fs')
const { lstatSync, readdirSync } = fs
const { join } = require('path')

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory)
getDirectories('.').forEach(directory => {
    var text=fs.readFileSync("./"+directory+"/index.js", 'utf8')
    text=textReplace(text)
    fs.writeFileSync('./' + directory + "/autoComplete.js", text.join("\n"))   
    var cl=fs.readFileSync("../CHANGELOG.md", "utf8")
    fs.writeFileSync('./' + directory + "/CHANGELOG.md", cl)
    
});
  
