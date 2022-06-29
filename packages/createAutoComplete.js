var textReplace=function(text) {
    var lines=text.split("\n")    
    var keywords=["Given", "When", "Then", "MAFWhen"]
    return ["/* eslint-disable */", "const { When, Given, Then } = require('@cucumber/cucumber');",
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
const isFile = source => lstatSync(source).isFile()
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory)
const getFiles = source =>
  readdirSync(source).map(name => join(source, name)).filter(isFile)
getDirectories('.').forEach(directory => {
    let text=""
    if(directory==="aws") {
      text=getFiles('./aws/stepDefinitions').map(i=>fs.readFileSync(i, 'utf8')).join("\n")
    } else {
      text=fs.readFileSync("./"+directory+"/index.js", 'utf8')
    }
    text=textReplace(text)
    fs.writeFileSync('./' + directory + "/autoComplete.js", text.join("\n"))   
    var cl=fs.readFileSync("../CHANGELOG.md", "utf8")
    fs.writeFileSync('./' + directory + "/CHANGELOG.md", cl)
    var gitignore=fs.readFileSync("../.npmignore", "utf8")
    fs.writeFileSync('./' + directory + "/.npmignore", gitignore) 
});
