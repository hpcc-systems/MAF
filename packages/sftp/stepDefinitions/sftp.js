const { MAFWhen, getFilePath, filltemplate } = require('@ln-maf/core')
const { setDefaultTimeout } = require('@cucumber/cucumber')
const { execSync } = require('child_process')
const Client = require('ssh2-sftp-client')
const fs = require('fs')
const sftp = new Client()
const path = require('path')

setDefaultTimeout(15 * 60 * 1000)

const conf = {
    host: process.env.HOSTNAME,
    username: process.env.USERNAME,
    agent: process.env.SSH_AUTH_SOCK
}

MAFWhen('server {string} is set', function (name) {
    name = filltemplate(name, this.results)
    conf.host = name
    return conf
})

MAFWhen('username {string} is set', function (name) {
    name = filltemplate(name, this.results)
    conf.username = name
    return conf
})

MAFWhen('a user send command {string} to server {string}', function (command, server) {
    return execSync(`ssh ${conf.username}@${server} ${command}`).toString().trim()
})

MAFWhen('list of files from remote server directory {string} is received', async function (serverDirectory) {
    serverDirectory = filltemplate(serverDirectory, this.results)
    await sftp.connect(conf)
    const remoteFiles = await sftp.list(serverDirectory, item => item.type === '-')
    await sftp.end()
    return remoteFiles.map(file => file.name)
})

MAFWhen('list of files from remote server {string} directory {string} is received', async function (serverName, serverDirectory) {
    conf.host = filltemplate(serverName, this.results)
    serverDirectory = filltemplate(serverDirectory, this.results)
    await sftp.connect(conf)
    const remoteFiles = await sftp.list(serverDirectory, item => item.type === '-')
    await sftp.end()
    return remoteFiles.map(file => file.name)
})

MAFWhen('file {string} is copied as user {string} from server {string}', function (serverFile, userName, serverName) {
    serverFile = filltemplate(serverFile, this.results)
    conf.username = filltemplate(userName, this.results)
    conf.host = filltemplate(serverName, this.results)
    return getFileFromServer(serverFile, getFilePath(path.basename(serverFile), this))
})

MAFWhen('file {string} is get from remote server to {string}', function (serverFile, localFile) {
    serverFile = filltemplate(serverFile, this.results)
    localFile = filltemplate(localFile, this.results)
    localFile = getFilePath(localFile, this)
    return getFileFromServer(serverFile, localFile)
})

MAFWhen('latest file as user {string} from server {string} in directory {string} is retrieved', async function (userName, serverName, directory) {
    userName = filltemplate(userName, this.results)
    serverName = filltemplate(serverName, this.results)
    directory = filltemplate(directory, this.results)
    conf.host = serverName
    conf.username = userName
    return await copyLatestFileFromServer.call(this, directory)
})

MAFWhen('latest file as user {string} from server {string} in directory {string} is downloaded to {string}', async function (userName, serverName, directory, localPath) {
    userName = filltemplate(userName, this.results)
    serverName = filltemplate(serverName, this.results)
    directory = filltemplate(directory, this.results)
    localPath = filltemplate(localPath, this.results)
    conf.host = serverName
    conf.username = userName
    return await copyLatestFileFromServer.call(this, directory, localPath)
})

MAFWhen('latest file as user {string} is read from server {string} in directory {string}', async function (userName, serverName, directory) {
    userName = filltemplate(userName, this.results)
    serverName = filltemplate(serverName, this.results)
    directory = filltemplate(directory, this.results)
    conf.host = serverName
    conf.username = userName
    return await readLatestFileFromServer.call(this, directory)
})

MAFWhen('latest file in remote directory {string} is retrieved', async function (remoteDirectory) {
    remoteDirectory = filltemplate(remoteDirectory, this.results)
    return await copyLatestFileFromServer.call(this, remoteDirectory)
})

MAFWhen('second to last file as user {string} from server {string} in directory {string} is retrieved', async function (userName, serverName, directory) {
    userName = filltemplate(userName, this.results)
    conf.host = filltemplate(serverName, this.results)
    directory = filltemplate(directory, this.results)
    return await copySecondLatestFileFromServer.call(this, directory)
})

MAFWhen('a user puts file {string} on server {string} to folder {string}', function (file, server, serverDirectory) {
    file = filltemplate(file, this.results)
    conf.host = filltemplate(server, this.results)
    serverDirectory = filltemplate(serverDirectory, this.results)
    if (!serverDirectory.endsWith('/')) {
        serverDirectory += '/'
    }
    return putFileToServer.call(this, file, serverDirectory + file)
})

MAFWhen('a user puts file {string} on server {string} to folder {string} from local path {string}', function (file, server, serverDirectory, localPath) {
    file = filltemplate(file, this.results)
    conf.host = filltemplate(server, this.results)
    serverDirectory = filltemplate(serverDirectory, this.results)
    localPath = filltemplate(localPath, this.results)
    if (!serverDirectory.endsWith('/')) {
        serverDirectory += '/'
    }
    return putFileToServer.call(this, file, serverDirectory + file, localPath)
})

MAFWhen('a user {string} puts file {string} on server {string} to folder {string}', function (user, file, server, serverDirectory) {
    file = filltemplate(file, this.results)
    conf.user = filltemplate(user, this.results)
    conf.host = filltemplate(server, this.results)
    serverDirectory = filltemplate(serverDirectory, this.results)
    if (!serverDirectory.endsWith('/')) {
        serverDirectory += '/'
    }
    return putFileToServer.call(this, file, serverDirectory + file)
})

MAFWhen('a user {string} puts file {string} on server {string} to folder {string} from local path {string}', function (user, file, server, serverDirectory, localPath) {
    file = filltemplate(file, this.results)
    conf.user = filltemplate(user, this.results)
    conf.host = filltemplate(server, this.results)
    serverDirectory = filltemplate(serverDirectory, this.results)
    localPath = filltemplate(localPath, this.results)
    if (!serverDirectory.endsWith('/')) {
        serverDirectory += '/'
    }
    return putFileToServer.call(this, file, serverDirectory + file, localPath)
})

MAFWhen('file {string} is put on remote server to {string}', async function (localFile, remoteFile) {
    localFile = filltemplate(localFile, this.results)
    localFile = getFilePath(localFile, this)
    remoteFile = filltemplate(remoteFile, this.results)
    if (!fs.existsSync(localFile)) {
        throw Error('File "' + localFile + '" doesn\'t exist')
    }
    await putFileToServer.call(this, localFile, remoteFile)
    return remoteFile
})

MAFWhen('file {string} is put on remote server {string} to {string}', async function (localFile, remoteServer, remoteFile) {
    localFile = filltemplate(localFile, this.results)
    localFile = getFilePath(localFile, this)
    conf.host = filltemplate(remoteServer, this.results)
    remoteFile = filltemplate(remoteFile, this.results)
    if (!fs.existsSync(localFile)) {
        throw Error('File "' + localFile + '" doesn\'t exist')
    }
    remoteFile = filltemplate(remoteFile, this.results)
    await putFileToServer.call(this, localFile, remoteFile)
    return remoteFile
})

async function getSFTP(localFile, remoteFile) {
    await sftp.connect(conf)
    await sftp.fastGet(remoteFile, localFile)
    await sftp.end()
}

async function putSFTP(localFile, remoteFile) {
    await sftp.connect(conf)
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
async function putFileToServer(localFile, remoteFile, localPath) {
    if (!localPath) {
        localPath = getFilePath('', this)
    }
    if (!fs.existsSync(localPath + localFile)) {
        throw Error('File "' + localPath + localFile + '" doesn\'t exist')
    }
    await putSFTP(localPath + localFile, remoteFile)
    return remoteFile
}

/**
 * Copies the latest file from a server's directory to the local directory
 *
 * @param {string} serverDirectory The linux path on the remote containing the latest file
 * @returns {string} The name of the file downloaded
 */
async function copyLatestFileFromServer(serverDirectory, localPath) {
    if (!serverDirectory.endsWith('/')) {
        serverDirectory = serverDirectory + '/'
    }
    if (localPath && !localPath.endsWith('/')) {
        localPath = localPath + '/'
    }
    await sftp.connect(conf)
    const remoteFiles = await sftp.list(serverDirectory, item => item.type === '-')
    if (remoteFiles.length === 0) {
        throw Error(`No file found on ${conf.host}:${serverDirectory}`)
    }
    remoteFiles.sort((a, b) => a.modifyTime - b.modifyTime)
    const latestRemoteFile = remoteFiles.at(-1).name
    if (!localPath) {
        localPath = getFilePath('', this)
    }
    await sftp.fastGet(serverDirectory + latestRemoteFile, localPath + latestRemoteFile)
    await sftp.end()
    return latestRemoteFile
}

/**
 * Copies the latest file from a server's directory to memory
 *
 * @param {string} serverDirectory The linux path on the remote containing the latest file
 * @returns {string} The file contents
 */
async function readLatestFileFromServer(serverDirectory) {
    if (!serverDirectory.endsWith('/')) {
        serverDirectory = serverDirectory + '/'
    }
    await sftp.connect(conf)
    const remoteFiles = await sftp.list(serverDirectory, item => item.type === '-')
    if (remoteFiles.length === 0) {
        throw Error(`No file found on ${conf.host}:${serverDirectory}`)
    }
    remoteFiles.sort((a, b) => a.modifyTime - b.modifyTime)
    const latestRemoteFile = remoteFiles.at(-1).name
    const remoteFileContents = await sftp.get(serverDirectory + latestRemoteFile)
    await sftp.end()
    return remoteFileContents.toString()
}

/**
 * Copies the 2nd latest file from a server's directory to the local directory
 *
 * @param {string} serverDirectory The linux path on the remote containing the 2nd latest file
 * @returns {string} The name of the file downloaded
 */
async function copySecondLatestFileFromServer(serverDirectory, localPath) {
    if (!serverDirectory.endsWith('/')) {
        serverDirectory = serverDirectory + '/'
    }
    if (localPath && !localPath.endsWith('/')) {
        localPath = localPath + '/'
    }
    await sftp.connect(conf)
    const remoteFiles = await sftp.list(serverDirectory, item => item.type === '-')
    if (remoteFiles.length <= 1) {
        throw Error(`One or no files found on ${conf.host}:${serverDirectory}`)
    }
    remoteFiles.sort((a, b) => a.modifyTime - b.modifyTime)
    const secondLatestRemoteFile = remoteFiles.at(-2).name
    if (!localPath) {
        localPath = getFilePath('', this)
    }
    await sftp.fastGet(serverDirectory + secondLatestRemoteFile, localPath + secondLatestRemoteFile)
    await sftp.end()
    return secondLatestRemoteFile
}
