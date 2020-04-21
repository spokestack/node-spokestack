import gql from 'graphql-tag'

export const SynthesizeSsml = gql`
  query synthesizeSsml($ssml: String!, $voice: String!) {
    synthesizeSsml(ssml: $ssml, voice: $voice) {
      url
    }
  }
`

export const SynthesizeMarkdown = gql`
  query synthesizeMarkdown($markdown: String!, $voice: String!) {
    synthesizeMarkdown(markdown: $markdown, voice: $voice) {
      url
    }
  }
`

export const SynthesizeText = gql`
  query synthesizeText($text: String!, $voice: String!) {
    synthesizeText(text: $text, voice: $voice) {
      url
    }
  }
`
