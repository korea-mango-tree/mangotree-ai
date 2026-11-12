// 포트폴리오 게시물 이미지 API (Vercel Serverless Function)
// GET /api/post-images?url=<mangotree.co.kr 게시판 읽기·상품 페이지 주소>
// 망고트리 게시판 읽기 페이지(bbs/board.php)나 상품 페이지(shop/item.php)를 서버에서 읽어,
// "내용 영역" 안의 이미지 주소만 골라 돌려준다. 포트폴리오 모달(assets/portfolio-pages.js)이 쓴다.
// 브라우저에서 바로 읽으면 다른 출처라 막히므로 같은 출처(/api)에서 대신 읽는다.

const HOSTS = new Set(['mangotree.co.kr', 'www.mangotree.co.kr']);
const PATHS = /^\/(bbs\/board\.php|shop\/item\.php)$/;
// 내용 영역(그누보드 게시판 본문·첨부 이미지, 영카트 상품 상세설명)
const CONTENT_IDS = ['bo_v_con', 'bo_v_img', 'sit_inf_explan', 'sit_inf'];
const MAX_IMAGES = 60;

function targetUrl(raw) {
  try {
    const u = new URL(String(raw || ''));
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!HOSTS.has(u.hostname) || !PATHS.test(u.pathname)) return null;
    u.protocol = 'https:';
    return u;
  } catch (_) { return null; }
}

// id="..." 로 시작하는 div 의 끝(짝이 맞는 </div>)까지 잘라낸다
function block(html, id) {
  const m = new RegExp('<(div|section|article)[^>]*\\bid\\s*=\\s*["\']' + id + '["\'][^>]*>', 'i').exec(html);
  if (!m) return '';
  const tag = m[1].toLowerCase();
  const re = new RegExp('<\\/?' + tag + '\\b[^>]*>', 'gi');
  re.lastIndex = m.index + m[0].length;
  let depth = 1, t;
  while ((t = re.exec(html))) {
    depth += t[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(m.index, t.index);
  }
  return html.slice(m.index);
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function imagesIn(fragment, base) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(fragment))) {
    const tag = m[0];
    const src = (/\bdata-src\s*=\s*["']([^"']+)["']/i.exec(tag) || /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag) || [])[1];
    if (!src) continue;
    let abs;
    try { abs = new URL(decode(src.trim()), base); } catch (_) { continue; }
    if (!/^https?:$/.test(abs.protocol)) continue;
    // 스킨 아이콘·버튼 이미지는 제외하고 업로드 이미지(data/)만
    if (!/\/data\//.test(abs.pathname)) continue;
    out.push(abs.href);
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const url = targetUrl(req.query && req.query.url);
  if (!url) return res.status(400).json({ error: 'invalid_url' });

  let html;
  try {
    const r = await fetch(url.href, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; mangotree-ai-portfolio)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream_' + r.status });
    html = await r.text();
  } catch (e) {
    return res.status(502).json({ error: 'upstream_failed' });
  }

  const seen = new Set();
  const images = [];
  for (const id of CONTENT_IDS) {
    for (const src of imagesIn(block(html, id), url.href)) {
      // 첨부 썸네일(thumb-...)과 원본이 같이 있으면 원본을 우선
      const key = src.replace(/\/thumb-([^/]+?)_\d+x\d+(\.\w+)$/, '/$1$2');
      if (seen.has(key)) continue;
      seen.add(key);
      images.push(src);
      if (images.length >= MAX_IMAGES) break;
    }
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({ url: url.href, images });
};
