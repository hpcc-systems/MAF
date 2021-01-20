const { defineParameterType } = require('@cucumber/cucumber')

defineParameterType({
    name: 'timeQualifier',           // name
    regexp: /before|after/ // regexp
})

defineParameterType({
  name: 'jsonObject',
  regexp: /(it|\d+)|(item |file |string |)([\"\'](.*)[\"\'])\s?|[\"\'](.*)[\"\']/,
  transformer: (arg, arg2, arg3) => {
    return { type1: arg, type2: arg2, value: arg3 }
  }
})
defineParameterType({
  name: 'validationsEquivalence',
  regexp: /[=><]=?/
})
