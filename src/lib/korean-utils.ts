const CHOSUNG = [
  'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ',
  'ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ',
]

const CHOSUNG_SET = new Set(CHOSUNG)

export function getChosung(str: string): string {
  return Array.from(str)
    .map((ch) => {
      const code = ch.charCodeAt(0)
      if (code >= 0xAC00 && code <= 0xD7A3) {
        return CHOSUNG[Math.floor((code - 0xAC00) / 28 / 21)]
      }
      return ch
    })
    .join('')
}

export function isChosungQuery(query: string): boolean {
  if (query.length === 0) return false
  return Array.from(query).every((ch) => CHOSUNG_SET.has(ch))
}

export function matchChosung(text: string, query: string): boolean {
  const textChosung = getChosung(text)
  return textChosung.includes(query)
}
