import {readFile} from 'node:fs/promises'

export const loadMimeTypesFromOs = async (mimeTypesFilePath = '/etc/mime.types') => {
  const mimeTypes = {}
  return Object.fromEntries(
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
