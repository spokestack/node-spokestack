export default function search(term: string) {
  return fetch('/search', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ term })
  }).then((response) => response.json())
}
