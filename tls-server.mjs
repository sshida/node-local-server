#!/usr/bin/env node

import tls from 'node:tls'
import fs from 'node:fs'
import os from 'node:os'

let gAutoStopTimer = null
let gListenPort = 8888
let gListenAddress = "localhost"
let gHostName = `${gListenAddress}`

let optDelayedReponseMs = 0
let optAutoStopMs = 3600000 // 1 hour
let gConfigPath = `${os.homedir()}/.myCerts`

const usage = (message) => {
  if(message) console.error(`[31;1m${message}[m\n`)
  console.error(`usage: ${process.argv[1]} [-n] [-p port] [-H hostname] [-D delayMs] [ -C configFolderPath ] ]
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
while(process?.argv.length > 2 && process.argv[2].startsWith('-')) {
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

const options = { // TLS options
  key: fs.readFileSync(`${gConfigPath}/privkey.pem`),
  cert: (fs.readFileSync(`${gConfigPath}/fullchain.pem`)
      || fs.readFileSync(`${gConfigPath}/cert.pem`)),

  // This is necessary only if using client certificate authentication.
  requestCert: true,

  // This is necessary only if the client uses a self-signed certificate.
  ca: Array.from({length: 10}).map((_, i) => {
    try {
      return fs.readFileSync(`${gConfigPath}/ca.cert`)
    } catch(error) {
      return null
    }
  }).filter(v => v)
}

console.info(`Config folder:`, gConfigPath)
tls.createServer(options, socket => {
  console.info('Connected inbound socket:',
              socket.authorized ? 'authorized' : 'unauthorized')
  socket.write('welcome!\n')
  socket.setEncoding('utf8')
  socket.pipe(socket)
}).listen(gListenPort, gListenAddress, () => {
  console.info(`server bound: ${gListenAddress}:${gListenPort}`);
})

