import ApolloClient from 'apollo-boost'

export default function createClient() {
  return new ApolloClient<Record<string, unknown>>({
    uri: '/graphql',
    onError: (error) => {
      if (!error) {
        console.error('[GraphQL error]: no details given by Apollo')
        return
      }
      const graphQLErrors = error.graphQLErrors
      const networkError = error.networkError
      if (graphQLErrors) {
        if (Array.isArray(graphQLErrors)) {
          graphQLErrors.forEach(function ({ message, locations, path }) {
            console.warn(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          })
        } else {
          console.log(graphQLErrors)
        }
      }
      if (networkError) {
        console.warn('[Network error]: ' + networkError)
      }
    }
  })
}
