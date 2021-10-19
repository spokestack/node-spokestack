import { NluInfer, SynthesizeText } from '../apollo/queries'
import { NluModelSource, NluResult, RootQueryType } from '../types'
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
import RepoLink, { Repo } from '../components/RepoLink'

import { ApolloClient } from 'apollo-boost'
import { DEFAULT_WIDTH } from '../theme'
import Layout from '../components/Layout'
import createClient from '../apollo/createClient'
import debounce from 'lodash/debounce'
import search from '../utils/search'
import upload from '../utils/upload'

interface CommandDemo<T> {
  error?: string
  status: string
  result: T | null
}

interface State {
  activeDemo: 'wakeword' | 'keyword' | 'search' | 'searchStream' | 'nlu' | 'nluStream' | null
  keyword: CommandDemo<string>
  loading: boolean
  nlu: CommandDemo<NluResult>
  search: CommandDemo<{ repos: Repo[]; total: number }>
  term: string
  wakeword: CommandDemo<boolean>
}

export default class Index extends PureComponent {
  private audio: HTMLAudioElement | undefined
  private client: ApolloClient<Record<string, unknown>> | undefined
  private playing = false
  private initialized = false
  state: State = {
    activeDemo: null,
    keyword: { error: '', status: 'Idle', result: '' },
    loading: false,
    nlu: { error: '', status: 'Idle', result: null },
    search: { error: '', status: 'Idle', result: null },
    term: '',
    wakeword: { error: '', status: 'Idle', result: false }
  }
  updateTerm = debounce((term: string | undefined) => {
    if (term) {
      this.setState({ term })
    }
  }, 500)

  async componentDidUpdate(_: Record<string, unknown>, { term: prevTerm }: State) {
    const { activeDemo, loading, term } = this.state
    if (!loading && term && term !== prevTerm) {
      if (activeDemo === 'search' || activeDemo === 'searchStream') {
        await this.search()
      } else if (activeDemo === 'nlu' || activeDemo === 'nluStream') {
        await this.nluInfer()
      }
      if (activeDemo === 'search' || activeDemo === 'nlu') {
        this.setState({ activeDemo: null })
      }
    }
  }

  componentDidMount() {
    this.client = createClient()
    this.audio = document.createElement('audio')
    document.body.appendChild(this.audio)
  }

  componentWillUnmount() {
    this.client?.stop()
    if (this.audio) {
      document.body.removeChild(this.audio)
    }
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
                this.setState({
                  wakeword: { error: 'Detected speech, but did not match', result: false }
                })
                break
              case SpeechEventType.Error:
                console.error(event.error)
                this.stopRecording()
                break
            }
          }
        })
        this.setState({ wakeword: { status: 'Listening...', result: false } })
      } catch (e) {
        this.setState({
          wakeword: {
            result: false,
            status: 'Idle',
            error:
              'This browser does not support wake word detection. Please try a Blink browser, such as Chrome, Edge, Opera, Vivaldi, or Brave.'
          }
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
      this.audio.addEventListener('play', this.play)
      this.audio.addEventListener('error', (error) => {
        console.error('Player error', error)
        const { activeDemo, search } = this.state
        if (activeDemo === 'search' || activeDemo === 'searchStream') {
          this.setState({
            search: {
              ...search,
              error: 'There was an error playing the audio.',
              status: 'Idle'
            }
          })
        }
        this.pause()
        this.stopStreaming()
      })
    }
  }

  isStreaming() {
    return this.state.activeDemo && this.state.activeDemo.indexOf('Stream') > -1
  }

  play = () => {
    if (!this.audio?.src) {
      return
    }
    console.log('Playing', this.audio?.src)
    this.playing = true
    const { activeDemo, nlu, search } = this.state
    if (activeDemo === 'nlu' || activeDemo === 'nluStream') {
      this.setState({
        nlu: {
          ...nlu,
          status: 'Playing audio...'
        }
      })
    } else if (activeDemo === 'search' || activeDemo === 'searchStream') {
      this.setState({
        search: {
          ...search,
          status: 'Playing audio...'
        }
      })
    }
  }

  pause = () => {
    console.log('Paused')
    this.playing = false
    const { activeDemo, nlu, search } = this.state
    this.setState({
      nlu: {
        ...nlu,
        status: activeDemo === 'nluStream' ? 'Recording...' : 'Idle'
      },
      search: {
        ...search,
        status: activeDemo === 'searchStream' ? 'Recording...' : 'Idle'
      }
    })
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
        search: {
          error: 'There was a problem with the search. Please check your connection.',
          result: null,
          status: 'Idle'
        }
      })
      return
    }
    this.setState({ loading: true, search: { status: 'Searching...' } })
    return result
      .then(async (response) => {
        // console.log(`Got response for term: ${term}`)
        const searchState: State['search'] = {
          status: 'Idle',
          result: {
            repos: response.items || [],
            total: response.total_count
          }
        }
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
            this.audio.pause()
            searchState.status = 'Playing audio...'
            this.audio.src = data.url
            this.audio.currentTime = 0
            this.audio.play()
          }
        }
        this.setState({ loading: false, search: searchState })
      })
      .catch((err) => {
        this.setState({
          search: {
            status: 'Idle',
            error: err.message,
            result: null
          },
          loading: false
        })
      })
  }

  async nluInfer() {
    if (!this.client) {
      return
    }
    const { term } = this.state
    this.setState({ loading: true })
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
        this.setState({ loading: false, nlu: { error: '', status: 'Idle', result: data } })
      }
    } catch (e) {
      console.error(e)
      this.setState({
        loading: false,
        nlu: {
          error: 'There was an error in the nluInfer query. Check logs or try again.',
          status: 'Idle',
          result: null
        }
      })
    }
  }

  record3Seconds = async (demo: 'search' | 'nlu') => {
    if (this.state.activeDemo) {
      console.log('Demo already active', this.state.activeDemo)
      return
    }
    if (this.playing) {
      console.log('Audio is currently playing')
      return
    }
    this.initialize()
    this.setState({ activeDemo: demo })
    let buffer: AudioBuffer
    const updateDemo = (active: boolean, status: string, error = '') => {
      const { nlu, search } = this.state
      if (demo === 'search') {
        this.setState({
          activeDemo: active ? demo : null,
          search: {
            ...search,
            error,
            status
          }
        })
      } else {
        this.setState({
          activeDemo: active ? demo : null,
          nlu: {
            ...nlu,
            error,
            status
          }
        })
      }
    }
    try {
      buffer = await record({
        time: 3,
        onProgress: (remaining) => {
          updateDemo(true, `Recording..${remaining}`)
        }
      })
    } catch (e) {
      console.error(e)
      updateDemo(false, 'Idle', (e as Error).message)
      this.setState({ activeDemo: null })
      return
    }
    upload(buffer)
      .then(({ text, message }) => {
        if (typeof text === 'string') {
          if (text) {
            updateDemo(true, 'Idle')
            this.updateTerm(text)
          } else {
            updateDemo(
              false,
              'Idle',
              'The audio was uploaded successfully, but the transcript was empty. Please check your microphone.'
            )
          }
        } else {
          updateDemo(
            false,
            'Idle',
            message || 'There was a problem uploading the audio data. Please try again.'
          )
        }
      })
      .catch((error) => {
        console.error(error)
        updateDemo(false, 'Idle', 'There was a problem uploading the audio data. Please try again.')
      })
  }

  stopStreaming() {
    if (this.isStreaming()) {
      stopStream()
      this.setState({ activeDemo: null })
    }
  }

  toggleRecordStream = async (demo: 'searchStream' | 'nluStream') => {
    const { activeDemo } = this.state
    const streaming = this.isStreaming()
    // Skip if another demo is active
    if (activeDemo !== null && !streaming) {
      console.log('Another demo is active', activeDemo)
      return
    }
    if (streaming) {
      this.stopStreaming()
    } else if (!this.playing) {
      this.initialize()
      const updateDemo = (active: boolean, error = '') => {
        const { nlu, search } = this.state
        if (demo === 'searchStream') {
          this.setState({
            activeDemo: active ? demo : null,
            search: {
              ...search,
              error,
              status: active ? 'Recording...' : 'Idle'
            }
          })
        } else {
          this.setState({
            activeDemo: active ? demo : null,
            nlu: {
              ...nlu,
              error,
              status: active ? 'Recording...' : 'Idle'
            }
          })
        }
      }
      try {
        let ws: WebSocket
        try {
          ;[ws] = await startStream({
            isPlaying: () => this.playing
          })
        } catch (e) {
          console.error(e)
          this.setState({ activeDemo: null, error: (e as Error).message })
          return
        }
        ws.addEventListener('open', () => {
          updateDemo(true)
        })
        ws.addEventListener('close', (event) => {
          let error = ''
          console.log(event)
          if (event.code !== 1000) {
            error =
              event.reason ||
              'An error occured and the socket has closed. Please refresh and try again.'
          }
          updateDemo(false, error)
        })
        ws.addEventListener('error', (event) => {
          console.error(event)
          updateDemo(
            false,
            'An error occured and the socket has closed. Please refresh and try again.'
          )
        })
        ws.addEventListener('message', (e) => {
          this.updateTerm(e.data)
        })
      } catch (e) {
        console.error(e)
        updateDemo(
          false,
          'An error occured when attempting to start the stream. Please refresh and try again.'
        )
      }
    }
  }

  render() {
    const { activeDemo, keyword, nlu, search, term, wakeword } = this.state
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
            onClick={this.toggleWakeword}
          >
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
            onClick={this.toggleKeyword}
          >
            {activeDemo ? 'Stop' : 'Record'}
          </button>
        </div>
        <h4>
          Status: <span id="keyword-status">{keyword.status}</span>
        </h4>
        {keyword.result && <p>Detected: {keyword.result}</p>}

        <hr />
        <h1>Test Minecraft Sample NLU Model</h1>
        <p>
          Try saying, &ldquo;How do I make a castle?&rdquo; That should return
          &ldquo;RecipeIntent&rdquo;.
        </p>
        {nlu.error && <p className="error">{nlu.error}</p>}
        <div className="buttons">
          <button
            disabled={isActive}
            className="btn btn-primary"
            onClick={() => this.record3Seconds('nlu')}
          >
            Record 3 seconds
          </button>
          <button
            disabled={isActive && activeDemo !== 'nluStream'}
            className="btn btn-primary"
            onClick={() => this.toggleRecordStream('nluStream')}
          >
            {activeDemo === 'nluStream' ? 'Stop' : 'Start'} streaming
          </button>
        </div>
        <h4>
          Status: <span id="status">{nlu.status}</span>
        </h4>
        {nlu.result && (
          <div>
            <p>Search term: {term}</p>
            <h4>Sample Minecraft NLU Result</h4>
            <p>Intent: {nlu.result.intent}</p>
            <p>Confidence: {nlu.result.confidence}</p>
          </div>
        )}

        <hr />
        <h1>Search GitHub for repositories using your voice</h1>
        {search.error && <p className="error">{search.error}</p>}
        <div className="buttons">
          <button
            disabled={isActive}
            className="btn btn-primary"
            onClick={() => this.record3Seconds('search')}
          >
            Record 3 seconds
          </button>
          <button
            disabled={isActive && activeDemo !== 'searchStream'}
            className="btn btn-primary"
            onClick={() => this.toggleRecordStream('searchStream')}
          >
            {activeDemo === 'searchStream' ? 'Stop' : 'Start'} streaming
          </button>
        </div>
        <h4>
          Status: <span id="status">{search.status}</span>
        </h4>
        <hr />
        {search.result && (
          <div>
            <p>Search term: {term}</p>
            <p className="total">
              Found {search.result.total || 0} result{Number(search.result.total) > 1 ? 's' : ''}
            </p>
            <h3>Matching GitHub Repositories</h3>
            {Number(search.result.repos?.length) > 0 ? (
              <div className="results">
                {search.result.repos.map((repo) => (
                  <RepoLink key={repo.id} repo={repo} />
                ))}
              </div>
            ) : (
              <h5>No results</h5>
            )}
          </div>
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
