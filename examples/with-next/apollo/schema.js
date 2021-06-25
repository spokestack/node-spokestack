const shell = require('shelljs')
const clientId = process.env.SS_API_CLIENT_ID
const clientSecret = process.env.SS_API_CLIENT_SECRET

if (!clientId || !clientSecret) {
  shell.echo(
    'This script requires both SS_API_CLIENT_ID and SS_API_CLIENT_SECRET be set in the environment.'
  )
  shell.exit(1)
}

shell.exec(`graphql-inspector introspect http://localhost:3000/graphql \
  --write ./apollo/schema.graphql
`)
