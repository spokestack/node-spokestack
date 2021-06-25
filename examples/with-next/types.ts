export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
}

export enum NluModelSource {
  Account = 'ACCOUNT',
  Shared = 'SHARED'
}

/** Spokestack NLU inference results */
export type NluResult = {
  __typename?: 'NluResult'
  confidence: Scalars['Float']
  intent: Scalars['String']
  slots?: Maybe<Array<Maybe<NluSlot>>>
}

/**
 * Spokestack NLU inference slot
 *
 * Slot values are dependent on their type, so the value is always returned
 * as a JSON encoding of the slot value.
 */
export type NluSlot = {
  __typename?: 'NluSlot'
  confidence: Scalars['Float']
  key: Scalars['String']
  text?: Maybe<Scalars['String']>
  value: Scalars['String']
}

export type RootMutationType = {
  __typename?: 'RootMutationType'
  /** Import an NLU model from a third party platform */
  nluImport?: Maybe<Scalars['Boolean']>
}

export type RootMutationTypeNluImportArgs = {
  body: Scalars['String']
  name: Scalars['String']
  platform: Scalars['String']
}

export type RootQueryType = {
  __typename?: 'RootQueryType'
  /** Classify an utterance using an NLU model */
  nluInfer?: Maybe<NluResult>
  /** Generate an audio sample for a given voice/markdown pair */
  synthesizeMarkdown?: Maybe<SynthesisResult>
  /** Generate an audio sample for a given voice/ssml pair */
  synthesizeSsml?: Maybe<SynthesisResult>
  /** Generate an audio sample for a given voice/text pair */
  synthesizeText?: Maybe<SynthesisResult>
}

export type RootQueryTypeNluInferArgs = {
  input: Scalars['String']
  model: Scalars['String']
  source?: Maybe<NluModelSource>
}

export type RootQueryTypeSynthesizeMarkdownArgs = {
  markdown: Scalars['String']
  profile?: Maybe<SynthesisProfile>
  voice: Scalars['String']
}

export type RootQueryTypeSynthesizeSsmlArgs = {
  profile?: Maybe<SynthesisProfile>
  ssml: Scalars['String']
  voice: Scalars['String']
}

export type RootQueryTypeSynthesizeTextArgs = {
  profile?: Maybe<SynthesisProfile>
  text: Scalars['String']
  voice: Scalars['String']
}

export enum SynthesisProfile {
  Alexa = 'ALEXA',
  Default = 'DEFAULT',
  Discord = 'DISCORD'
}

export type SynthesisResult = {
  __typename?: 'SynthesisResult'
  url?: Maybe<Scalars['String']>
}
