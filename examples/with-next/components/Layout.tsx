import * as theme from '../theme'

import Head from 'next/head'
import React from 'react'
import Header from '../components/Header'

interface Props {
  title?: string
  children: React.ReactNode
}

export default function Layout({
  title = 'Spokestack Web Demo',
  children
}: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Header />

      <main className="content">{children}</main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: ${theme.mainBackground};
          color: ${theme.text};
          font-size: ${theme.fontSize};
          line-height: ${theme.lineHeight};
        }
        .content {
          padding: 30px;
        }
        a {
          line-height: 1.2rem;
          color: ${theme.link};
        }
        p {
          margin: 0 0 0.8em;
        }
        h1,
        h2,
        h3,
        h4 {
          margin: 0 0 1rem;
        }
        h1 {
          font-size: ${42 / 18}rem;
        }
        h2 {
          font-size: ${33 / 18}rem;
        }
        h3 {
          font-size: ${28 / 18}rem;
        }
        h4 {
          font-size: ${23 / 18}rem;
        }
        h5,
        h6 {
          font-size: 1rem;
          margin: 0;
        }
        h6 {
          font-weight: 600;
        }
        .btn {
          position: relative;
          height: 38px;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          text-align: center;
          background-color: ${theme.buttonBackground};
          border: 1px solid ${theme.buttonBackground};
          border-radius: 24px;
          font-size: ${theme.fontSizeButton};
          padding: 0 30px;
          white-space: nowrap;
          transition: background-color 0.2s ${theme.transitionEasing},
            border-color 0.2s ${theme.transitionEasing},
            color 0.2s ${theme.transitionEasing};
          cursor: pointer;
          text-decoration: none;
          color: ${theme.text};
          font-weight: 400;
          user-select: none;
        }
        .btn:visited {
          color: ${theme.text};
        }
        .btn:hover:not([disabled]),
        .btn:active:not([disabled]) {
          background-color: ${theme.buttonBackgroundHover};
          border-color: ${theme.buttonBackgroundHover};
          color: ${theme.text};
        }
        .btn:active:not([disabled]) {
          box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.8);
        }
        .btn[disabled],
        .btn.btn-submitting {
          opacity: 0.5;
          cursor: default;
          pointer-events: none;
        }
        .btn.btn-primary {
          border-color: ${theme.primary};
          background-color: white;
          color: ${theme.primary};
        }
        .btn.btn-primary:hover:not([disabled]),
        .btn.btn-primary:active:not([disabled]) {
          background-color: ${theme.primary};
          border-color: ${theme.primary};
          color: white;
        }
        .error {
          color: ${theme.error};
        }
      `}</style>
    </>
  )
}
