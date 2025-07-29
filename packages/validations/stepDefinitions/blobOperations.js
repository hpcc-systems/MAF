require('@ln-maf/core/parameter_types')

const { When } = require('@cucumber/cucumber')
const { MAFWhen, writeFile, readFileBuffer } = require('@ln-maf/core')

function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length)
    const view = new Uint8Array(ab)
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i]
    }
    return ab
}

MAFWhen('blob is read from file {string}', async function (fileName) {
    let res = readFileBuffer(fileName, this)
    const arrayBuff = toArrayBuffer(res)
    const f = () => arrayBuff
    f.bind(this)
    res = { arrayBuffer: f }
    return res
})

When('blob item {string} is written to file {string}', async function (blob, fileName) {
    const { fillTemplate } = require('@ln-maf/core')
    blob = fillTemplate(blob, this.results)
    blob = this.results[blob]
    const b = Buffer.from(await blob.arrayBuffer())
    writeFile(`${fileName}`, b, this)
})

When('blob item {string} is attached', async function (blob) {
    const { fillTemplate } = require('@ln-maf/core')
    blob = fillTemplate(blob, this.results)
    blob = this.results[blob]
    const b = Buffer.from(await blob.arrayBuffer())
    return this.attach(b, 'image/png')
})

const { Then } = require('@cucumber/cucumber')
const chai = require('chai')
const assert = chai.assert

Then('blob item {string} is equal to file {string}', async function (blob, fileName) {
    const { fillTemplate } = require('@ln-maf/core')
    blob = fillTemplate(blob, this.results)
    blob = this.results[blob]
    const b = await blob.arrayBuffer()
    const actualImage = readFileBuffer(`${fileName}`, this)
    assert.isTrue(Buffer.compare(actualImage, Buffer.from(b)) === 0)
})
