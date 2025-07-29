const { MAFWhen, getFilePath, fillTemplate } = require('@ln-maf/core')
const { setDefaultTimeout } = require('@cucumber/cucumber')
const Client = require('ssh2-sftp-client')
const fs = require('fs')
const sftp = new Client()
const path = require('path')

setDefaultTimeout(15 * 60 * 1000)

const conf = {
    agent: process.env.SSH_AUTH_SOCK
}
// Builds a request object from the given request, populating any missing fields using the results object
async function sftpConfigBuilder(config) {
    if (!config.host && this.results) {
        if (this.results.hostname) {
            config.host = this.results.hostname
        }
        if (this.results.host) {
            config.host = this.results.host
        }
    }
    if (!config.port && this.results && this.results.port) {
        config.port = this.results.port
    }
    if (!config.username && this.results && this.results.username) {
        config.username = this.results.username
    }
    if (!config.password && this.results && this.results.password) {
        config.password = this.results.password
    }

    if (!config.username) {
        throw Error('No username specified in SFTP config')
    }
    if (!config.host){
        throw Error('No host specified in SFTP config')
    }

    return config
}

async function getSFTP(remoteFile, localFile) {
    await sftp.connect((await sftpConfigBuilder.call(this, conf)))
    await sftp.fastGet(remoteFile, localFile)
    await sftp.end()
}

async function putSFTP(localFile, remoteFile) {
    await sftp.connect((await sftpConfigBuilder.call(this, conf)))
    await sftp.fastPut(localFile, remoteFile)
    await sftp.end()
}

/**
 * Gets a file from the remote server to a local directory
*
* @param {string} remoteFile The linux path on the remote containing the file (/path/to/file.txt)
* @param {string} localFile The linux path to place the file locally
* @returns {string} The path and name of the file downloaded
*/
async function getFileFromServer(remoteFile, localFile) {
    const localFilePath = path.dirname(localFile)
    if (!fs.existsSync(localFilePath)) {
        fs.mkdirSync(localFilePath, { recursive: true })
    }
    await getSFTP(remoteFile, localFile)
    return localFile
}

/**
 * Puts a file from the local directory to a remote server
 *
 * @param {string} localFile The linux path of the local file
 * @param {string} remoteFile The linux path of the remote file on the server where the file will be placed (/path/to/file.txt)
 * @returns {string} The path and name of the file uploaded
*/
async function putFileToServer(localFile, remoteFile) {
    if (!fs.existsSync(localFile)) {
        throw Error('File "' + localFile + '" doesn\'t exist')
    }
    await putSFTP(localFile, remoteFile)
    return remoteFile
}

/**
 * Copies the latest file from a server's directory to the local directory
*
* @param {string} serverDirectory The linux path on the remote containing the latest file
* @param {string} localFile The local file name where the file will be downloaded
* @returns {string} The name of the file downloaded
*/
async function copyLatestFileFromServer(serverDirectory, localFile) {
    if (!serverDirectory.endsWith('/')) {
        serverDirectory = serverDirectory + '/'
    }
    await sftp.connect((await sftpConfigBuilder.call(this, conf)))
    const remoteFiles = await sftp.list(serverDirectory, item => item.type === '-')
    if (remoteFiles.length === 0) {
        await sftp.end()
        throw Error(`No file found on ${conf.host}:${serverDirectory}`)
    }
    remoteFiles.sort((a, b) => a.modifyTime - b.modifyTime)
    const latestRemoteFile = remoteFiles.at(-1).name
    
    // If localFile is not provided or is a directory, append the filename
    if (!localFile || localFile === '' || localFile.endsWith('/')) {
        localFile = getFilePath('', this)
        localFile = path.join(localFile, latestRemoteFile)
    }
    
    // Ensure local directory exists
    const localDir = path.dirname(localFile)
    if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true })
    }
    
    await sftp.fastGet(serverDirectory + latestRemoteFile, localFile)
    await sftp.end()
    return latestRemoteFile
}

MAFWhen('list of files from remote server directory {string} is received', async function (serverDirectory) {
    serverDirectory = fillTemplate(serverDirectory, this.results)
    await sftp.connect((await sftpConfigBuilder.call(this, conf)))
    let remoteFiles
    try{
        remoteFiles = await sftp.list(serverDirectory, item => item.type === '-')
    } catch (error) {
        if (error.code !== 2) { // 2 is 'no such file or directory', which is not an error in this case
            throw Error('Error listing files:', error)
        } else {
            remoteFiles = []
        }
    }
    await sftp.end()
    return remoteFiles.map(file => file.name)
})

MAFWhen('file {string} is downloaded from server as file {string}', function (serverFile, file) {
    serverFile = fillTemplate(serverFile, this.results)
    file = fillTemplate(file, this.results)
    const localFile = getFilePath(file, this)
    return getFileFromServer.call(this, serverFile, localFile)
})

MAFWhen('latest file from server directory {string} is downloaded as file {string}', async function (remoteDirectory, file) {
    remoteDirectory = fillTemplate(remoteDirectory, this.results)
    file = fillTemplate(file, this.results)
    const localFile = getFilePath(file, this)
    return await copyLatestFileFromServer.call(this, remoteDirectory, localFile)
})

MAFWhen('file {string} is put in server folder {string}', function (file, serverDirectory) {
    file = fillTemplate(file, this.results)
    const localFile = getFilePath(file, this)
    serverDirectory = fillTemplate(serverDirectory, this.results)
    if (!serverDirectory.endsWith('/')) {
        serverDirectory += '/'
    }
    return putFileToServer.call(this, localFile, serverDirectory + file)
})
