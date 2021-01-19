var fillTemplate=require('../index').fillTemplate
var Cucumber=require('cucumber')

var equal=require('deep-equal')
var chai=require('chai')
var assert=chai.assert;
var Given = Cucumber.Given;
var When = Cucumber.When;
var Then = Cucumber.Then;


   Given('{string} = {string}', function (string, val) {
     var obj=fillTemplate(val, this)
     try{
       obj=JSON.parse(obj)
     } catch(e) {}
     this[string]=obj
   });
   Given('{string} = {int}', function (string, int) {
     this[string]=int
   });
       
   When('run templateString', function (docString) {
     this["lastRun"]=fillTemplate(docString, this)
     this.attach(JSON.stringify(this.lastRun))
   })

   Then('it is equal to item:', function (docString) {
     assert.equal(this.lastRun, docString, `${this.lastRun} not equal to ${docString}`)
   })
     
