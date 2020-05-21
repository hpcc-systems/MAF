const { ParameterType, defineParameterType } = require('cucumber')
defineParameterType({
    name: 'when',           // name
    regexp: /before|after/ // regexp
})

