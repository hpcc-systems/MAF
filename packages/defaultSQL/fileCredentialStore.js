const fs = require('fs').promises
const path = require('path')
const os = require('os')
const crypto = require('crypto')

/**
 * File-based credential storage as a replacement for keytar
 * Stores credentials in an encrypted JSON file in the user's home directory
 */
class FileCredentialStore {
    constructor() {
        this.credentialsDir = path.join(os.homedir(), '.maf-credentials')
        this.credentialsFile = path.join(this.credentialsDir, 'credentials.json')
        this.encryptionKey = this.getOrCreateEncryptionKey()
    }

    /**
     * Get or create an encryption key for credential storage
     * @returns {string} Encryption key
     */
    getOrCreateEncryptionKey() {
        const keyPath = path.join(this.credentialsDir, '.key')
        try {
            const existingKey = require('fs').readFileSync(keyPath, 'utf8')
            return existingKey
        } catch {
            // Generate new key if it doesn't exist
            const newKey = crypto.randomBytes(32).toString('hex')
            try {
                require('fs').mkdirSync(this.credentialsDir, { recursive: true, mode: 0o700 })
                require('fs').writeFileSync(keyPath, newKey, { mode: 0o600 })
                return newKey
            } catch {
                console.warn('Could not create encryption key file, using session key')
                return newKey
            }
        }
    }

    /**
     * Encrypt text using AES-256-GCM
     * @param {string} text - Text to encrypt
     * @returns {string} Encrypted text with IV and auth tag
     */
    encrypt(text) {
        const iv = crypto.randomBytes(16)
        const key = Buffer.from(this.encryptionKey, 'hex')
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
        cipher.setAAD(Buffer.from('maf-credentials'))

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag()
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
    }

    /**
     * Decrypt text using AES-256-GCM
     * @param {string} encryptedText - Encrypted text with IV and auth tag
     * @returns {string} Decrypted text
     */
    decrypt(encryptedText) {
        const parts = encryptedText.split(':')
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format')
        }

        const iv = Buffer.from(parts[0], 'hex')
        const authTag = Buffer.from(parts[1], 'hex')
        const encrypted = parts[2]

        const key = Buffer.from(this.encryptionKey, 'hex')
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
        decipher.setAAD(Buffer.from('maf-credentials'))
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    }

    /**
     * Load credentials from file
     * @returns {Promise<Object>} Credentials object
     */
    async loadCredentials() {
        try {
            const data = await fs.readFile(this.credentialsFile, 'utf8')
            const encryptedData = JSON.parse(data)
            const decryptedData = this.decrypt(encryptedData.data)
            return JSON.parse(decryptedData)
        } catch {
            // Return empty credentials if file doesn't exist or can't be read
            return {}
        }
    }

    /**
     * Save credentials to file
     * @param {Object} credentials - Credentials object to save
     */
    async saveCredentials(credentials) {
        try {
            await fs.mkdir(this.credentialsDir, { recursive: true, mode: 0o700 })
            const dataToEncrypt = JSON.stringify(credentials)
            const encryptedData = this.encrypt(dataToEncrypt)
            await fs.writeFile(
                this.credentialsFile,
                JSON.stringify({ data: encryptedData }, null, 2),
                { mode: 0o600 }
            )
        } catch (error) {
            throw new Error(`Failed to save credentials: ${error.message}`)
        }
    }

    /**
     * Get password for a service/account combination
     * @param {string} service - Service name
     * @param {string} account - Account name
     * @returns {Promise<string|null>} Password or null if not found
     */
    async getPassword(service, account) {
        const credentials = await this.loadCredentials()
        const key = `${service}:${account}`
        return credentials[key] || null
    }

    /**
     * Set password for a service/account combination
     * @param {string} service - Service name
     * @param {string} account - Account name
     * @param {string} password - Password to store
     */
    async setPassword(service, account, password) {
        const credentials = await this.loadCredentials()
        const key = `${service}:${account}`
        credentials[key] = password
        await this.saveCredentials(credentials)
    }

    /**
     * Delete password for a service/account combination
     * @param {string} service - Service name
     * @param {string} account - Account name
     */
    async deletePassword(service, account) {
        const credentials = await this.loadCredentials()
        const key = `${service}:${account}`
        delete credentials[key]
        await this.saveCredentials(credentials)
    }
}

module.exports = FileCredentialStore
