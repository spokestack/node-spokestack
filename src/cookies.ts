const rcolon = /\s*;\s*/g
export function getCookie(name: string, cookies?: string) {
  if (!cookies) {
    return null
  }
  for (const cookie of cookies.split(rcolon)) {
    const [key, value] = cookie.split('=')
    if (key === name) {
      return decodeURIComponent(value)
    }
  }
}

export function setCookie(name: string, value: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${encodeURIComponent(value)};` + document.cookie
  }
}

export function removeCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = document.cookie.replace(new RegExp(`${name}=[^;]+;\\s*`), '')
  }
}
