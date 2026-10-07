// 기업 검색 API (Vercel Serverless Function)
// GET /api/company-search?q=기업명
// 네이버 검색 API의 지역(업체) 검색과 웹문서 검색을 함께 조회해 후보 기업 목록을 돌려준다.
//
// 필요한 환경 변수
//   NAVER_CLIENT_ID, NAVER_CLIENT_SECRET : https://developers.naver.com 에서 발급 (검색 API)
//   ALLOWED_ORIGINS : 호출을 허용할 사이트 주소, 쉼표로 구분
//                     (예: https://korea-mango-tree.github.io)

const NAVER = 'https://openapi.naver.com/v1/search/';

function strip(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .trim();
}

function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return ''; }
}

async function naver(kind, q, display) {
  const url = NAVER + kind + '.json?display=' + display + '&query=' + encodeURIComponent(q);
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(kind + ' ' + res.status);
  return (await res.json()).items || [];
}

module.exports = async function handler(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const q = String((req.query && req.query.q) || '').trim().slice(0, 50);
  if (q.length < 2) return res.status(400).json({ error: 'query_too_short' });
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return res.status(503).json({ error: 'search_not_configured' });
  }

  const [local, web] = await Promise.allSettled([naver('local', q, 5), naver('webkr', q, 10)]);
  if (local.status === 'rejected' && web.status === 'rejected') {
    return res.status(502).json({ error: 'search_failed' });
  }

  const companies = [];
  const seen = new Set();
  (local.status === 'fulfilled' ? local.value : []).forEach((it) => {
    const name = strip(it.title);
    const key = name + '|' + (it.roadAddress || it.address || '');
    if (!name || seen.has(key)) return;
    seen.add(key);
    companies.push({
      name,
      category: strip(it.category),
      address: strip(it.roadAddress || it.address),
      url: it.link || '',
      source: '네이버 지역 검색',
    });
  });

  // 업체 정보에 홈페이지가 없으면, 웹문서 중 이름이 일치하는 첫 사이트를 홈페이지 후보로 붙인다.
  const documents = (web.status === 'fulfilled' ? web.value : []).map((it) => ({
    title: strip(it.title),
    url: it.link,
    host: host(it.link),
    description: strip(it.description).slice(0, 160),
  }));
  companies.forEach((c) => {
    if (c.url) return;
    const doc = documents.find((d) => d.title.includes(c.name));
    if (doc) c.url = doc.url;
  });

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).json({ query: q, companies, documents: documents.slice(0, 5) });
};
