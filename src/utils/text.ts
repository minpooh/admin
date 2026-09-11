/**
 * 텍스트 유틸 — HTML 처리, 발췌 등.
 *
 * 리스트/요약/검색용으로 HTML 본문을 plain text 로 변환할 때 사용.
 */

const LEGACY_ASSET_ORIGIN = 'https://feelmaker.co.kr';

/**
 * 본문 HTML 의 자산 경로를 운영 도메인 기준으로 정규화.
 * - `src="/upload_notice/..."` 같은 root-relative → `https://feelmaker.co.kr/upload_notice/...`
 * - 절대 URL(`http(s)://...`), 프로토콜-relative(`//...`), data: 는 그대로 둠.
 */
export function normalizeLegacyAssetUrls(html: string): string {
  if (!html) return '';
  return html.replace(
    /\b(src|href)=(["'])(\/(?!\/)[^"']*)\2/gi,
    (_m, attr, q, path) => `${attr}=${q}${LEGACY_ASSET_ORIGIN}${path}${q}`,
  );
}

/** HTML 태그/엔티티 제거 후 plain text 로 반환. 연속 공백은 한 칸으로 축약. */
export function stripHtml(s: string): string {
  if (!s) return '';
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * `text` 안에서 `keyword` 가 처음 등장하는 위치 주변을 `radius` 만큼 잘라 반환.
 * 매칭이 없으면 앞에서 `radius*2` 만큼만 자른 문자열 반환.
 */
export function extractSnippet(text: string, keyword: string, radius = 45): string {
  const safeKeyword = keyword.trim();
  if (!safeKeyword) return '';

  const lowerText = text.toLowerCase();
  const lowerKeyword = safeKeyword.toLowerCase();
  const idx = lowerText.indexOf(lowerKeyword);
  if (idx < 0) return text.length > radius * 2 ? `${text.slice(0, radius * 2)}...` : text;

  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + lowerKeyword.length + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.slice(start, end)}${suffix}`;
}
