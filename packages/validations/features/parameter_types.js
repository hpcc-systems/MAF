const { ParameterType, defineParameterType } = require('cucumber')

defineParameterType({
    name: 'timeQualifier',           // name
    regexp: /before|after/ // regexp
})

defineParameterType({
  name: 'jsonObject',
  regexp: /(it|\d+)|(item |file |string |)([\"\'](.*)[\"\'])\s?|[\"\'](.*)[\"\']/,
  transformer: (arg, arg2) => {
    return { type: arg, value: arg2 }
  }
})
defineParameterType({
  name: 'validationsEquivalence',
  regexp: /[=><]=?/
})
