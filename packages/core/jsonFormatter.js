const { JsonFormatter } = require('@cucumber/cucumber')

class MAFJSONFormatter extends JsonFormatter {
    getStepData(options) {
        const step = super.getStepData(options)
        // Cucumber's legacy JSON formatter omits attachment filenames.
        step.embeddings?.forEach((embedding, index) => {
            const name = options.testStepAttachments[index].fileName
            if (name) embedding.name = name
        })
        return step
    }
}

module.exports = MAFJSONFormatter
