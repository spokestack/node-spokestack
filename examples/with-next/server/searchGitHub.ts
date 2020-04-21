import fetch from 'node-fetch'

export default function searchGitHub(term: string) {
  return fetch(`https://api.github.com/search/repositories?q=${term}&sort=stars&order=desc
  `).then((response) => response.json())
}
