const { When, Given, Then } = require('@cucumber/cucumber');
var stubby={}
Given('url {string}')
Given('api {string}')
Given('request {string}')
Given('headers {string}', stubby)
When('api request from {jsonObject} is performed')
When('perform api request:')
When('api request from {jsonObject} is performed with:')
When('method post')
When('method get')
Then('the status is ok')
Then('the status is not ok')
Then('status not ok')
Then('status ok')
Then('status {int}')
Then('the status is {int}');