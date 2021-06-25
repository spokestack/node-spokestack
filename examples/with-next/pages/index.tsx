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
import { NluModelSource, NluResult, RootQueryType } from '../types'

import { ApolloClient } from 'apollo-boost'
import { DEFAULT_WIDTH } from '../theme'
import Layout from '../components/Layout'
import RepoLink, { Repo } from '../components/RepoLink'
import { NluInfer, SynthesizeText } from '../apollo/queries'
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
  activeDemo: string | null
  error: string
  keyword: CommandDemo
  nluResult: NluResult | null
  results: Repo[]
  searching: boolean
  status: string
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
    activeDemo: null,
    error: '',
    keyword: { error: '', status: 'Idle', result: '' },
    nluResult: null,
    results: [],
    searching: false,
    status: 'Idle',
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
      this.nluInfer()
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
                this.setState({ wakeword: { error: 'Detected speech, but did not match' } })
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
        this.setState({
          wakeword: {
            error:
              'This browser does not support wake word detection. Please try a Blink browser, such as Chrome, Edge, Opera, Vivaldi, or Brave.'
          },
          result: false
        })
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
        this.setState({
          keyword: {
            error:
              'This browser does not support keyword detection. Please try a Blink browser, such as Chrome, Edge, Opera, Vivaldi, or Brave.',
            result: ''
          }
        })
        console.error(e)
        this.stopRecording()
      }
    }
  }

  stopRecording = () => {
    stopPipeline()
    const { keyword, wakeword } = this.state
    this.setState({
      activeDemo: null,
      status: 'Idle',
      keyword: { ...keyword, status: 'Idle' },
      wakeword: { ...wakeword, status: 'Idle' }
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
        this.setState({ status: 'There was an error playing the audio.' })
        this.pause()
        if (this.state.activeDemo === 'searchStream') {
          this.toggleRecordStream()
        }
      })
    }
  }

  pause = () => {
    this.playing = false
    this.setState({ status: this.state.activeDemo === 'searchStream' ? 'Recording...' : 'Idle' })
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
    // console.log(`Searching with term: ${term}`)
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
        // console.log(`Got response for term: ${term}`)
        this.setState({
          results: response.items || [],
          total: response.total_count
        })
        if (this.client && this.audio) {
          const res = await this.client.query<{
            synthesizeText: RootQueryType['synthesizeText']
          }>({
            fetchPolicy: 'no-cache',
            query: SynthesizeText,
            variables: {
              text: this.getPrompt(response),
              voice: 'demo-male'
            }
          })
          const data = res.data?.synthesizeText
          if (data?.url) {
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

  async nluInfer() {
    if (!this.client) {
      return
    }
    const { term } = this.state
    try {
      const response = await this.client.query<{
        nluInfer: RootQueryType['nluInfer']
      }>({
        fetchPolicy: 'no-cache',
        query: NluInfer,
        variables: {
          input: term,
          model: 'Minecraft',
          source: NluModelSource.Shared
        }
      })
      const data = response.data?.nluInfer
      if (data?.intent) {
        this.setState({ nluIntent: data.intent })
      }
    } catch (e) {
      console.error(e)
      this.setState({
        status: 'There was an error in the nluInfer query. Check logs or try again.'
      })
    }
  }

  record3Seconds = async () => {
    if (this.state.activeDemo || this.playing) {
      return
    }
    this.initialize()
    this.setState({ activeDemo: 'search' })
    let buffer: AudioBuffer
    try {
      buffer = await record({
        time: 3,
        onProgress: (remaining) => {
          this.setState({ status: `Recording..${remaining}` })
        }
      })
    } catch (e) {
      console.error(e)
      this.setState({ activeDemo: null, error: e.message })
      return
    }
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
    const { activeDemo } = this.state
    if (activeDemo !== null && activeDemo !== 'searchStream') {
      return
    }
    if (activeDemo === 'searchStream') {
      stopStream()
      this.setState({ activeDemo: null })
    } else if (!this.playing) {
      this.initialize()
      try {
        let ws: WebSocket
        try {
          ;[ws] = await startStream({ isPlaying: () => this.playing })
        } catch (e) {
          console.error(e)
          this.setState({ activeDemo: null, error: e.message })
          return
        }
        ws.addEventListener('open', () =>
          this.setState({ activeDemo: 'searchStream', status: 'Recording...' })
        )
        ws.addEventListener('close', (event) => {
          this.setState({
            activeDemo: null,
            status:
              event.code === 1002
                ? event.reason ||
                  'There was a problem starting the record stream. Please refresh and try again.'
                : 'Idle'
          })
        })
        ws.addEventListener('error', (event) => {
          console.error(event)
          this.setState({
            activeDemo: null,
            status: 'There was a problem starting the record stream. Please refresh and try again.'
          })
        })
        ws.addEventListener('message', (e) => {
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
      nluResult,
      results,
      searching,
      status,
      term,
      total,
      wakeword
    } = this.state
    const isActive = !!activeDemo
    return (
      <Layout>
        <h1>Test a wakeword model</h1>
        <p>Press record and say, &ldquo;Spokestack&rdquo;</p>
        {wakeword.error && <p className="error">{wakeword.error}</p>}
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
        {wakeword.result && <p>Detected!</p>}
        <hr />
        <h1>Test a keyword model</h1>
        <p>Press record and say a number between 0 and 9.</p>
        {keyword.error && <p className="error">{keyword.error}</p>}
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
        {keyword.result && <p>Detected: {keyword.result}</p>}
        <hr />
        <h1>Search GitHub for repositories using your voice</h1>
        <p>We will also pass the asr result through a sample NLU model for Minecraft</p>
        {error && <p className="error">{error}</p>}
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
            {activeDemo === 'searchStream' ? 'Stop' : 'Start'} streaming
          </button>
        </div>
        <h4>
          Status: <span id="status">{status}</span>
        </h4>
        <hr />
        {term && <p>Search term: {term}</p>}
        {searching ? (
          <p>Searching...</p>
        ) : (
          term && (
            <div>
              <h4>Sample Minecraft NLU Result</h4>
              <p>Intent: {nluResult?.intent}</p>
              <p>Confidence: {nluResult?.confidence}</p>
              <hr />
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
            max-width: 400px;
            margin: 1em 0;
          }
          p {
            width: 100%;
            margin: 0;
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
