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
let data = read('../README.md').replace(new RegExp(header + '[\\w\\W]+'), '') + header

function redoLinks(data) {
  return (
    data
      // Remove links that aren't links to source
      .replace(/\[([^:]+)\]\(.*?\)/g, '$1')
  )
}

function getModuleContent(filename) {
  return redoLinks(read(`../docs/modules/${filename}`)).replace(/[\w\W]+##\s*Functions/, '')
}

function getInterfaceContent(filename, name) {
  return (
    `\n\n#### ${name}` +
    redoLinks(read(`../docs/interfaces/${filename}`))
      .replace(/[\w\W]+##\s*Properties/, '')
      .replace(/___/g, '')
      .replace(/###/g, '#####')
  )
}

const modules = [
  '_server_expressmiddleware_.md',
  '_server_socketserver_.md',
  '_server_asr_.md',
  '_server_encryptsecret_.md'
]
modules.forEach((filename) => {
  data += getModuleContent(filename)
})

data += '\n---\n\n## Convenience functions for the client'
data += '\n\nThese functions are available exports from `spokestack/client`.'

data += getModuleContent('_client_record_.md')
data += getInterfaceContent('_client_record_.recordconfig.md', 'RecordConfig')
data += getModuleContent('_client_recordstream_.md')
data += getModuleContent('_client_convertfloat32toint16_.md')

data += '\n---\n\n### Utility functions for the client'
data +=
  '\n\nThese are low-level functions for working with your own processors, available from `spokestack/client`.'
data += getModuleContent('_client_processor_.md')
data += getInterfaceContent('_client_processor_.processorreturnvalue.md', 'ProcessorReturnValue')
data += getModuleContent('_client_concatenateaudiobuffers_.md')
data += getModuleContent('_client_countdown_.md')

// Write a pretty version
write('../README.md', prettier.format(data, { ...pkg.prettier, parser: 'markdown' }))
