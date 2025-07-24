const steps = require('./buildEm')
module.exports = (text) => {
    return steps.filter((stepDefinition) =>
        stepDefinition.matchesStepName(text)
    )
}
