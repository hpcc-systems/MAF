require('@ln-maf/core/parameter_types')

const { When } = require('@cucumber/cucumber')
const { fillTemplate } = require('@ln-maf/core')
const { MAFWhen, tryAttach, performJSONObjectTransform } = require('@ln-maf/core')

function setToString(location, value, scenario) {
    const { MAFSave, applyJSONToString } = require('@ln-maf/core')
    MAFSave.call(scenario, location, applyJSONToString(value, scenario))
}

MAFWhen('{jsonObject} is base64 encoded', function (item) {
    item = performJSONObjectTransform.call(this, item)
    if (typeof item !== 'string') {
        item = JSON.stringify(item)
    }
    const encode = (Buffer.from(item, 'ascii').toString('base64'))
    return encode
})

MAFWhen('{jsonObject} is base64 decoded', function (item) {
    item = performJSONObjectTransform.call(this, item)
    if (typeof item !== 'string') {
        throw new Error('Item type needs to be a string for base64 decoding, but it was a ' + typeof item)
    }
    return (Buffer.from(item, 'base64').toString('ascii'))
})

MAFWhen('the value {string} is base64 decoded and resaved', function (item) {
    item = fillTemplate(item, this.results)
    const unencrypted = (Buffer.from(this.results[item], 'base64').toString('ascii'))
    this.results[item] = unencrypted
    tryAttach.call(this, 'Decoded value: ' + unencrypted)
})

const performEncrypt = function () {
    const options = {}
    options.header = this.results.header
    const jwt = require('jsonwebtoken')
    setToString('lastRun', jwt.sign(this.results.jwtPayload, this.results.privateKey, options), this)
}

When('sign item {string} using jwt', function (item) {
    item = fillTemplate(item, this.results)
    item = fillTemplate(this.results[item], this.results)
    setToString('jwtPayload', item, this, false)
    performEncrypt.call(this)
})

When('sign using jwt:', function (docString) {
    setToString('jwtPayload', docString, this, false)
    performEncrypt.call(this)
})

MAFWhen('generate rsa key', function () {
    const crypto = require('crypto')
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    })
    return privateKey
})
