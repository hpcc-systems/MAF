const { filltemplate } = require('../index')
const Cucumber = require('@cucumber/cucumber')

const chai = require('chai')
const assert = chai.assert
const When = Cucumber.When
const Then = Cucumber.Then

Then('it is exactly equal to:', function (docString) {
  assert.equal(this.results.lastRun, docString, `${this.lastRun} not equal to ${docString}`)
})
When('run templateString', function (docString) {
  if (!this.results) {
    this.results = {}
  }
  this.results.lastRun = filltemplate(docString, this.results)
  this.attach(JSON.stringify(this.results.lastRun))
})
