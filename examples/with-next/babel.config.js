const path = require('path')
const pak = require('../../package.json')

module.exports = {
  presets: ['next/babel'],
  plugins: [
    'transform-optional-chaining',
    [
      'module-resolver',
      {
        alias: {
          [pak.name]: path.join(__dirname, '..', '..', pak.source)
        }
      }
    ]
  ]
}
