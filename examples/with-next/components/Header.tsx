import React from 'react'
import * as theme from '../theme'

export default function Header() {
  return (
    <header className="header">
      <a href="/" className="logo">
        <img src="/images/logo.svg" className="logo-image" />
      </a>
      <style jsx>{`
        .header {
          height: 60px;
          margin: 0;
          padding: 0 30px;
          background-color: ${theme.primary};
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          user-select: none;
        }
        .logo {
          line-height: 0;
        }
        .logo-image {
          line-height: 0;
          max-width: none;
          margin: 0;
          width: 185px;
          height: 60px;
        }
      `}</style>
    </header>
  )
}
