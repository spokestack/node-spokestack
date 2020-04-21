import React, { PureComponent } from 'react'
import { Repo, SynthesisResult } from '../types'
import { record, startStream, stopStream } from 'spokestack/client'

import { ApolloClient } from 'apollo-boost'
import { DEFAULT_WIDTH } from '../theme'
import Layout from '../components/Layout'
import RepoLink from '../components/RepoLink'
import { SynthesizeMarkdown } from '../apollo/queries'
import createClient from '../apollo/createClient'
import debounce from 'lodash/debounce'
import search from '../utils/search'
import upload from '../utils/upload'

interface State {
  error: string
  results: Repo[]
  searching: boolean
  status: string
  streaming: boolean
  term: string
  total: number
}

export default class Index extends PureComponent {
  private audio: HTMLAudioElement | undefined
  private client: ApolloClient<{}> | undefined
  private playing = false
  private initialized = false
  state: State = {
    error: '',
    results: [],
    searching: false,
    status: 'Idle',
    streaming: false,
    term: '',
    total: 0
  }
  updateTerm = debounce((term: string | undefined) => {
    if (typeof term === 'string') {
      this.setState({ term })
    }
  }, 250)

  componentDidUpdate(_: {}, { term: prevTerm }: State) {
    const { searching, term } = this.state
    if (!searching && term && term !== prevTerm) {
      this.search()
    }
  }

  componentDidMount() {
    this.client = createClient()
    this.audio = new Audio()
  }

  componentWillUnmount() {
    this.client?.stop()
    this.audio?.removeEventListener('pause', this.pause)
  }

  initialize() {
    if (this.initialized) {
      return
    }
    this.initialized = true
    if (this.audio) {
      // Play in response to a click
      // so future plays do not require a click
      this.audio.play()
      this.audio.addEventListener('pause', this.pause)
    }
  }

  pause = () => {
    console.log('paused')
    this.playing = false
  }

  search = async () => {
    const { term } = this.state
    console.log(`Searching with term: ${term}`)
    const result = search(term)
    if (!result) {
      this.setState({
        error:
          'There was a problem with the search. Please check your connection.',
        results: [],
        total: 0
      })
      return
    }
    this.setState({ searching: true })
    result
      .then(async (response) => {
        console.log(`Got response for term: ${term}`)
        this.setState({
          results: response.items || [],
          total: response.total_count
        })
        if (this.client) {
          const res = await this.client.query<{
            synthesizeMarkdown: SynthesisResult
          }>({
            fetchPolicy: 'no-cache',
            query: SynthesizeMarkdown,
            variables: {
              markdown: `I found ${
                response.total_count > 1000 ? 'a lot of' : response.total_count
              } results. The first one is ${response.items[0].name}`,
              voice: 'demo-male'
            }
          })
          const data = res.data && res.data.synthesizeMarkdown
          if (data.url && this.audio) {
            this.playing = true
            this.audio.src = data.url
            this.audio.play()
          }
        }
        this.setState({ searching: false })
      })
      .catch((err) => {
        this.setState({
          error: err.message,
          results: [],
          searching: false,
          total: 0
        })
      })
  }

  record3Seconds = async () => {
    this.initialize()
    const buffer = await record({
      time: 3,
      onProgress: (remaining) => {
        this.setState({ status: `Recording..${remaining}` })
      }
    })
    upload(buffer).then(({ text, message }) => {
      if (text) {
        this.setState({ status: 'Idle' })
        this.updateTerm(text)
      } else {
        this.setState({
          status:
            message ||
            'There was a problem uploading the audio data. Please try again'
        })
      }
    })
  }

  toggleRecordStream = async () => {
    const { streaming } = this.state
    if (streaming) {
      stopStream()
      this.setState({ streaming: false })
    } else {
      this.initialize()
      try {
        const ws = await startStream(() => this.playing)
        this.setState({ streaming: true })
        ws.addEventListener('open', () =>
          this.setState({ status: 'Recording...' })
        )
        ws.addEventListener('close', () => this.setState({ status: 'Idle' }))
        ws.addEventListener('message', (e) => this.updateTerm(e.data))
      } catch (e) {
        console.error(e)
        this.setState({
          status:
            'There was a problem starting the record stream. Please refresh and try again.'
        })
      }
    }
  }

  render() {
    const {
      error,
      results,
      searching,
      status,
      streaming,
      term,
      total
    } = this.state
    return (
      <Layout>
        <header className="header">
          <h1>Spokestack Web Speech Demo</h1>
          <p>Search GitHub repos with voice</p>
        </header>
        <div className="buttons">
          <button className="btn" onClick={this.record3Seconds}>
            Record 3 seconds
          </button>
          <button className="btn" onClick={this.toggleRecordStream}>
            {streaming ? 'Stop' : 'Start'} streaming
          </button>
        </div>
        <h4>
          Status: <span id="status">{status}</span>
        </h4>
        {error && <p className="error">{error}</p>}
        {term && <p className="wrapper">Search term: {term}</p>}
        {searching ? (
          <p className="wrapper">Searching...</p>
        ) : (
          term && (
            <div className="wrapper">
              <p className="total">
                Found {total || 0} result{total > 1 ? 's' : ''}
              </p>
              <h3>Matching GitHub Repositories</h3>
              {results.length > 0 ? (
                <div className="results">
                  {results.map((repo) => (
                    <RepoLink key={repo.id} repo={repo} />
                  ))}
                </div>
              ) : (
                <h5>No results</h5>
              )}
            </div>
          )
        )}
        <style jsx>{`
          .header h1 {
            margin: 0;
          }
          .buttons {
            display: grid;
            grid-template-columns: 1fr;
            grid-gap: 20px;
            max-width: 300px;
            margin-bottom: 1em;
          }
          .wrapper {
            width: 100%;
          }
          .results {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            grid-auto-rows: max-content;
            grid-gap: 20px;
          }
          @media (min-width: ${DEFAULT_WIDTH}) {
            .buttons {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </Layout>
    )
  }
}
