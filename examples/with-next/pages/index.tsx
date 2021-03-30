import {
  PipelineProfile,
  SpeechEventType,
  record,
  startPipeline,
  startStream,
  stopPipeline,
  stopStream
} from 'spokestack/client'
import React, { PureComponent } from 'react'
import { Repo, SynthesisResult } from '../types'

import { ApolloClient } from 'apollo-boost'
import { DEFAULT_WIDTH } from '../theme'
import Layout from '../components/Layout'
import RepoLink from '../components/RepoLink'
import { SynthesizeText } from '../apollo/queries'
import createClient from '../apollo/createClient'
import debounce from 'lodash/debounce'
import search from '../utils/search'
import upload from '../utils/upload'

interface CommandDemo {
  error: string
  status: string
  result: string | boolean
}

interface State {
  activeDemo: string | undefined
  error: string
  keyword: CommandDemo
  results: Repo[]
  searching: boolean
  status: string
  streaming: boolean
  term: string
  total: number
  wakeword: CommandDemo
}

export default class Index extends PureComponent {
  private audio: HTMLAudioElement | undefined
  private client: ApolloClient<Record<string, unknown>> | undefined
  private playing = false
  private initialized = false
  state: State = {
    activeDemo: undefined,
    error: '',
    keyword: { error: '', status: 'Idle', result: '' },
    results: [],
    searching: false,
    status: 'Idle',
    streaming: false,
    term: '',
    total: 0,
    wakeword: { error: '', status: 'Idle', result: false }
  }
  updateTerm = debounce((term: string | undefined) => {
    if (term) {
      this.setState({ term })
    }
  }, 500)

  componentDidUpdate(_: Record<string, unknown>, { term: prevTerm }: State) {
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

  toggleWakeword = async () => {
    const isActive = !!this.state.activeDemo
    if (isActive) {
      this.stopRecording()
    } else {
      this.setState({ activeDemo: 'wakeword', wakeword: { status: 'Calibrating...' } })

      try {
        await startPipeline({
          profile: PipelineProfile.Wakeword,
          baseUrls: { wakeword: 'https://s.spokestack.io/u/hgmYb/js' },
          onEvent: (event) => {
            switch (event.type) {
              case SpeechEventType.Activate:
                this.setState({ wakeword: { error: '', result: true } })
                break
              case SpeechEventType.Timeout:
                this.setState({ wakeword: { error: 'timeout' } })
                break
              case SpeechEventType.Error:
                console.error(event.error)
                this.stopRecording()
                break
            }
          }
        })
        this.setState({ wakeword: { status: 'Listening...', result: '' } })
      } catch (e) {
        console.error(e)
        this.stopRecording()
      }
    }
  }

  toggleKeyword = async () => {
    const isActive = !!this.state.activeDemo
    if (isActive) {
      this.stopRecording()
    } else {
      this.setState({ activeDemo: 'keyword', keyword: { status: 'Calibrating...' } })

      try {
        await startPipeline({
          profile: PipelineProfile.Keyword,
          keywordClasses: [
            'zero',
            'one',
            'two',
            'three',
            'four',
            'five',
            'six',
            'seven',
            'eight',
            'nine'
          ],
          baseUrls: { keyword: 'https://s.spokestack.io/u/UbMeX/js' },
          onEvent: (evt) => {
            const { type, transcript } = evt
            switch (type) {
              case SpeechEventType.Recognize:
                this.setState({ keyword: { error: '', result: transcript } })
                break
              case SpeechEventType.Error:
                console.error(evt.error)
                this.stopRecording()
                break
            }
          }
        })
        this.setState({ keyword: { status: 'Listening...', result: '' } })
      } catch (e) {
        console.error(e)
        this.stopRecording()
      }
    }
  }

  stopRecording = () => {
    stopPipeline()
    this.setState({
      activeDemo: null,
      status: 'Idle',
      keyword: { status: 'Idle' },
      wakeword: { status: 'Idle' }
    })
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
      this.audio.addEventListener('error', () => {
        this.setState({ status: 'There was an error loading the audio.' })
        if (this.state.streaming) {
          this.toggleRecordStream()
        }
      })
    }
  }

  pause = () => {
    this.playing = false
    this.setState({ status: this.state.streaming ? 'Recording...' : 'Idle' })
  }

  getPrompt(response: { total_count: number; items: { name: string }[] }) {
    if (response.total_count > 0) {
      const name = response.items[0].name
      let prompt = `I found ${
        response.total_count > 1000 ? 'a lot of' : response.total_count
      } results.`
      if (name) {
        prompt += ` The first one is "${name.replace(/-/g, ' ')}".`
      }
      return prompt
    }
    return "I couldn't find any results."
  }

  search = async () => {
    const { term } = this.state
    console.log(`Searching with term: ${term}`)
    const result = search(term)
    if (!result) {
      this.setState({
        error: 'There was a problem with the search. Please check your connection.',
        results: [],
        total: 0
      })
      return
    }
    this.setState({ searching: true, status: 'Searching...' })
    result
      .then(async (response) => {
        console.log(`Got response for term: ${term}`)
        this.setState({
          results: response.items || [],
          total: response.total_count
        })
        if (this.client) {
          const res = await this.client.query<{
            synthesizeText: SynthesisResult
          }>({
            fetchPolicy: 'no-cache',
            query: SynthesizeText,
            variables: {
              text: this.getPrompt(response),
              voice: 'demo-male'
            }
          })
          const data = res.data && res.data.synthesizeText
          if (data.url && this.audio) {
            this.setState({ status: 'Playing audio...' })
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
    this.setState({ activeDemo: 'search' })
    const buffer = await record({
      time: 3,
      onProgress: (remaining) => {
        this.setState({ status: `Recording..${remaining}` })
      }
    })
    this.setState({ activeDemo: null })
    upload(buffer)
      .then(({ text, message }) => {
        if (typeof text === 'string') {
          if (text) {
            this.setState({ status: 'Idle' })
            this.updateTerm(text)
          } else {
            this.setState({
              status:
                'The audio was uploaded successfully, but the transcript was empty. Please check your microphone.'
            })
          }
        } else {
          this.setState({
            status: message || 'There was a problem uploading the audio data. Please try again'
          })
        }
      })
      .catch((error) => {
        console.error(error)
        this.setState({
          status: 'There was a problem uploading the audio data. Please try again'
        })
      })
  }

  toggleRecordStream = async () => {
    const { streaming } = this.state
    if (streaming) {
      stopStream()
      this.setState({ activeDemo: null, streaming: false })
    } else {
      this.initialize()
      try {
        const [ws] = await startStream({ isPlaying: () => this.playing })
        ws.addEventListener('open', () =>
          this.setState({ activeDemo: 'searchStream', status: 'Recording...', streaming: true })
        )
        ws.addEventListener('close', (event) => {
          this.setState({
            activeDemo: null,
            status:
              event.code === 1002
                ? 'There was a problem starting the record stream. Please refresh and try again.'
                : 'Idle',
            streaming: false
          })
        })
        ws.addEventListener('error', (event) => {
          console.error(event)
          this.setState({
            activeDemo: null,
            status: 'There was a problem starting the record stream. Please refresh and try again.',
            streaming: false
          })
        })
        ws.addEventListener('message', (e) => {
          console.log(e)
          this.updateTerm(e.data)
        })
      } catch (e) {
        console.error(e)
        this.setState({
          activeDemo: null,
          status: 'There was a problem starting the record stream. Please refresh and try again.'
        })
      }
    }
  }

  render() {
    const {
      activeDemo,
      error,
      keyword,
      results,
      searching,
      status,
      streaming,
      term,
      total,
      wakeword
    } = this.state
    const isActive = !!activeDemo
    return (
      <Layout>
        <h1>Test a wakeword model</h1>
        <p>Press record and say, "Spokestack"</p>
        <div className="buttons">
          <button
            disabled={isActive && activeDemo !== 'wakeword'}
            className="btn btn-primary"
            onClick={this.toggleWakeword}>
            {activeDemo ? 'Stop' : 'Record'}
          </button>
        </div>
        <h4>
          Status: <span id="wakeword-status">{wakeword.status}</span>
        </h4>
        {wakeword.error && <p className="error">{wakeword.error}</p>}
        {wakeword.result && <p className="wrapper">Detected!</p>}
        <hr />
        <h1>Test a keyword model</h1>
        <p>Press record and say a number between 0 and 9.</p>
        <div className="buttons">
          <button
            disabled={isActive && activeDemo !== 'keyword'}
            className="btn btn-primary"
            onClick={this.toggleKeyword}>
            {activeDemo ? 'Stop' : 'Record'}
          </button>
        </div>
        <h4>
          Status: <span id="keyword-status">{keyword.status}</span>
        </h4>
        {keyword.error && <p className="error">{keyword.error}</p>}
        {keyword.result && <p className="wrapper">Detected: {keyword.result}</p>}
        <hr />
        <h1>Search GitHub for repositories using your voice</h1>
        <div className="buttons">
          <button
            disabled={isActive && activeDemo !== 'search'}
            className="btn btn-primary"
            onClick={this.record3Seconds}>
            Record 3 seconds
          </button>
          <button
            disabled={isActive && activeDemo !== 'searchStream'}
            className="btn btn-primary"
            onClick={this.toggleRecordStream}>
            {streaming ? 'Stop' : 'Start'} streaming
          </button>
        </div>
        <h4>
          Status: <span id="status">{status}</span>
        </h4>
        <hr />
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
            margin: 1em 0;
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
