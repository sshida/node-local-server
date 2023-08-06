#!/usr/bin/env node

// HTTP or HTTPS  server with node.js (version >= 18.x)

import https from 'node:https'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {setTimeout} from 'node:timers/promises'
import {initMimeTypes} from './mime-types.mjs'

const defaultMimeType = 'application/octet-stream'

let optDelayedReponseMs = 0
let optAutoStopMs = 3600000 // 1 hour
let gConfigPath = `${os.homedir()}/.myCerts`

const gChunkedThreashold = 2048 // chunked transfer for over 2048 bytes
const gChunkSize = 1024

let optInSecure = 0
let gAutoStopTimer = null
let gListenPort = 8888
let gListenAddress = "localhost"
let gHostName = `${gListenAddress}`

function usage(message) {
  if(message) console.error(`[31;1m${message}[m\n`)
  console.error(`usage: ${process.argv[1]} [-n] [-p port] [-H hostname] [-D delayMs] [ servingFolderPath [ configFolderPath ] ]
	-p: port number (default: ${gListenPort})
	-l: listen address (default: ${gListenAddress})
	-H: hostname (default: ${gHostName})
	-n: non-secure, use http (default: use https)
	-D: insert delay as millisec (default: 0 ms)
`)
  process.exit(1)
}

// parse command line
const getNextArgument = () => process.argv.splice(2, 1)[0];
while(process?.argv.length > 2 && process.argv[2].startsWith("-")) {
  const arg = getNextArgument()
  if(arg === '-h') usage()
  else if(arg === '-p') {
    if(! Number.isInteger(parseInt(gListenPort = getNextArgument())))
      usage(`Error: listen port not integer: ${gListenPort}`)
  } else if(arg === '-l') {
    if(! (gListenAddress = getNextArgument()))
      usage(`Error: listen address not found`)
  } else if(arg === '-H') {
    if(! (gHostName = getNextArgument()))
      usage(`Error: server hostname not found`)
  } else if(arg === '-n') {
    optInSecure++
  } else if(arg === '-C') {
    if(! (gConfigPath = getNextArgument()))
      usage(`Error: gConfigPath not found`)
  } else if(arg === '-D') {
    if(! Number.isInteger(optDelayedReponseMs = getNextArgument()))
      usage(`Error: delayed response is not number: ${optDelayedReponseMs}`)
  } else {
    usage("Error: unknown command line option:", arg)
  }
}

// serving folder
const dirPath = getNextArgument() || process.cwd()

const getMimeTypeFromFileName = filePath =>
  (filePath && mimeTypes[String(path.extname(filePath)).toLowerCase().slice(1)])
    || defaultMimeType

const autoStopServer = () => {
  if(gAutoStopTimer) clearTimeout(gAutoStopTimer)
  gAutoStopTimer = setTimeout(() => {
    console.warn(`Automatically stop this server:`, new Date())
    process.exit(2)
  }, optAutoStopMs)
}

const options = { // TLS options
  key: optInSecure ? null : fs.readFileSync(`${gConfigPath}/privkey.pem`),
  cert: optInSecure ? null : 
    (fs.readFileSync(`${gConfigPath}/fullchain.pem`)
      || fs.readFileSync(`${gConfigPath}/cert.pem`))
}

Array.prototype.cons = function(n = 2) {
  return this.reduce((acc, c) => {
    acc.at(-1)?.length < n ? acc.at(-1).push(c) : acc.push([c]) 
    return acc
  }, [])
}

const protocol = optInSecure ? http : https
protocol.createServer(options, async (request, response) => {
  autoStopServer() // automatically stop this server process

  const {socket, method, httpVersion, url, rawHeaders} = request
  const {remoteAddress} = socket
  const _headers = rawHeaders.cons(2)
  const urlo = new URL(request.url, `https://${gHostName}:${gListenPort}`)
  const filePath = dirPath +
    (urlo.pathname.endsWith('/') ? urlo.pathname + 'index.html'
      : urlo.pathname === '' ? '/index.html'
      : urlo.pathname === '/t1' ? '/t1/index.html'
      : urlo.pathname) 
  const contentType = getMimeTypeFromFileName(filePath)
  console.info({remoteAddress, method, httpVersion, url, _headers, filePath, contentType})

  // insert delay for http response
  if(optDelayedReponseMs) {
    console.warn(`Warn: insert delay: ${optDelayedReponseMs / 1000} s`)
    await setTimeout(optDelayedReponseMs)
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.error(`Error: ${error.code}: file: ${filePath}`)
      if(error.code == 'ENOENT') {
        fs.readFile('./404.html', (error, content) => {
          response.writeHead(404, { 'Content-Type': 'text/html' })
          response.end(content)
        })
      } else {
        response.writeHead(500, {"Content-Type": "application/json"})
        response.end(JSON.stringify({code: error.code, message: `unkown server error`}))
      }
      return
    }

    console.log(`200 ${filePath}`)
    if(content.length > gChunkedThreashold) {
      response.writeHead(200, {
        'Content-Type': contentType,
        'Transfer-Encoding': 'chunked'
      })

      const sendByChunk = (content, offset, chunkSize) => {
        if(content.length < offset) {
          console.debug(` done: chunked sending`)
          return response.end()
        }

        console.debug(` send chunk: ${offset}, ${chunkSize}`)
        response.write(content.subarray(offset, offset + chunkSize), 'utf-8',
          () => sendByChunk(content, offset + chunkSize, chunkSize))
      }
      sendByChunk(content, 0, gChunkSize)
    } else {
      response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': content.length,
      })
      response.end(content)
    }
  })
}).listen(gListenPort, gListenAddress);

console.info(`Serve folder:`, dirPath)
console.info(`Config folder:`, gConfigPath)
console.info(`Server running at ${optInSecure ? 'http' : 'https'}://${gHostName}:${gListenPort}/  listenAddress=${gListenAddress}`)
const mimeTypes = await initMimeTypes() // {}

console.info(`Automatically stop server after ${optAutoStopMs / 60 / 1000} minutes`)
autoStopServer()
