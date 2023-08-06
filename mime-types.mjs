import {readFile} from 'node:fs/promises'

const _myMimeTypes = {
  'txt': 'text/plain',
  'html': 'text/html',
  'md': 'text/html',
  'js': 'text/javascript',
  'mjs': 'text/javascript',
  'css': 'text/css',
  'json': 'application/json',
  'png': 'image/png',
  'jpg': 'image/jpg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'wav': 'audio/wav',
  'mp4': 'video/mp4',
  'otf': 'font/otf',
  'ttf': 'font/ttf',
  'woff': 'font/woff',
  'eot': 'application/vnd.ms-fontobject',

  'uml': 'text/plain',
  'wasm': 'application/wasm',
}

const loadMimeTypesFromOs = async (mimeTypesFilePath = '/etc/mime.types') =>
  Object.fromEntries(
    (await readFile(mimeTypesFilePath, {encoding: 'utf8'}))
    .split(/[\r\n]+/)
    .map(line => line.replace(/#.*/, ''))
    .map(line => line.trim())
    .filter(line => !(line.match(/^\s*$/)))
    .map(line => line.match(/(\S+)\s+(.+)/)) // [[mimeType, _restText], null, [a, b], ...]
    .filter(r => Array.isArray(r))
    .map(r => [r[1], r[2]]) // [[mimeType, _restText], ...]
    .filter(pair => typeof pair[1] === 'string' && pair[1].length > 0)
    .map(pair => pair[1].split(/\s+/).map(suffix => [suffix, pair[0]]))
    .flat()
  )

export const initMimeTypes = async () => {
  const mimeTypes = await loadMimeTypesFromOs()
  Object.keys(_myMimeTypes)
  .filter(key => !(mimeTypes[key]))
  .forEach(key => mimeTypes[key] = _myMimeTypes[key])
  return mimeTypes
}

// if(require.main !== module) { // CJS
if(import.meta.url === `file://${process.argv[1]}`) { // ESM
  const {ok} = await import('node:assert/strict')
  const {test} = await import('node:test')

  test(async t => {
    const r = await loadMimeTypesFromOs()
    ok(typeof r === 'object')
    ok(r.html)
    ok(r.html === 'text/html')
    ok(r.md === 'text/markdown')
  })
}
