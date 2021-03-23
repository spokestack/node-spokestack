const fs = require('fs')
const prettier = require('prettier')
const pkg = require('../package.json')
function read(filename) {
  return fs.readFileSync(`${__dirname}/${filename}`, { encoding: 'utf8' })
}
function write(filename, data) {
  return fs.writeFileSync(`${__dirname}/${filename}`, data)
}
// Start with the README
const header = '\n---\n\n## Convenience functions for Node.js servers'
let data = read('../README.md').replace(new RegExp(header + '[^]+'), '') + header

function redoLinks(data) {
  return (
    data
      // Remove links that aren't links to source
      .replace(/\[([^:]+)\]\(.*?\)/g, '$1')
      .replace(/\bPipelineProfile([^.])/g, '[PipelineProfile](#PipelineProfile)$1')
      .replace(/\bStage([^.])/g, '[Stage](#Stage)$1')
      .replace(/\bRecordConfig([^.])/g, '[RecordConfig](#RecordConfig)$1')
  )
}

/**
 * @param {string} filename
 * @param {Array<string>} functions List of functions to extract from docs
 */
function getModuleFunctions(filename, functions) {
  const available = redoLinks(read(`../docs/modules/${filename}`))
    // Remove everything up to functions
    .replace(/[^]+#{2}\s*Functions/, '')
    .split(/___/)
  return functions
    .map((fn) => {
      const rfn = new RegExp(`###\\s*${fn}[^#]+?`)
      const doc = available.find((existing) => rfn.test(existing))
      return doc || ''
    })
    .join('\n\n')
}

function getInterfaceContent(filename) {
  return (
    redoLinks(read(`../docs/interfaces/${filename}`))
      .replace(/# Interface:\s*(.+)[^]+##\s*Properties/, '#### $1')
      .replace(/___/g, '')
      .replace(/\n### /g, '\n##### ')
      // Remove superfluous type declarations
      .replace(/#### Type declaration:[^]+?▸ .+/g, '')
      // Remove double "Defined in"
      .replace(/(Defined in: .+)\n\nDefined in: .+/g, '$1')
  )
}

data += getModuleFunctions('index.md', [
  'spokestackMiddleware',
  'asrSocketServer',
  'asr',
  'googleASRSocketServer',
  'googleASR',
  'encryptSecret'
])

data += '\n---\n\n## Convenience functions for the client'
data += '\n\nThese functions are available exports from `spokestack/client`.'

data += getModuleFunctions('client.md', ['record'])
data += getInterfaceContent('client.recordconfig.md')
data += getModuleFunctions('client.md', [
  'startStream',
  'stopStream',
  'convertFloat32ToInt16',
  'startPipeline',
  'stopPipeline',
  'countdown'
])

data += '\n---\n\n## Low-level processor functions'
data +=
  '\n\nThese are low-level functions if you need to work with your own audio processors, available from `spokestack/client`.'
data += getModuleFunctions('client.md', ['startProcessor'])
data += getInterfaceContent('client.processorreturnvalue.md')
data += getModuleFunctions('client.md', ['stopProcessor', 'concatenateAudioBuffers'])

// Write a pretty version
write('../README.md', prettier.format(data, { ...pkg.prettier, parser: 'markdown' }))
