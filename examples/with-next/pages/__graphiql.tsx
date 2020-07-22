import React, { useEffect, useState } from 'react'

import { Fetcher } from 'graphiql/dist/components/GraphiQL'
import Head from 'next/head'

export default function GraphiQLPage() {
  const graphQLFetcher: Fetcher = (graphQLParams) =>
    fetch('/graphql', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams)
    })
      .then((response) => response.json())
      .catch((response) => response.text())

  const [graphiql, setGraphiql] = useState<React.ReactNode>(null)

  useEffect(() => {
    const GraphiQL = require('graphiql').default
    setGraphiql(<GraphiQL fetcher={graphQLFetcher} />)
  }, [])

  return (
    <>
      <Head>
        <link href="https://unpkg.com/graphiql/graphiql.min.css" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        body {
          height: 100%;
          margin: 0;
          width: 100%;
          overflow: hidden;
        }
        .graphiql-container {
          height: 100vh;
        }
      `}</style>
      {graphiql}
    </>
  )
}
