# 메인 영상 촬영 준비 (2026-11-10)

메인 영상은 6개 장면으로 구성한다. 1~5는 실제 화면 녹화, 6만 생성 영상이다.
정지 스크린샷이나 모형 UI는 자동 실행의 증거로 쓰지 않는다.
이번 단계에서는 외부 게시, 댓글 전송, 광고 집행 변경, 유료 생성을 하지 않았다.

## 조사 범위

- 이 저장소(mangotree-ai)
- `korea-mango-tree/makehtml`: pagemaker.ai.kr 소스. 커밋 `c477a9a` 기준
- `korea-mango-tree/characterfront`: AI 아바타 라이브 소스. 커밋 `9ff8316` 기준
- GitHub 조직 코드 검색(org:korea-mango-tree): searchad, bidAmt, reviewAnswer, commentAnswer, PostWriteForm 등

## 장면별 현황

| # | 장면 | 저장소 안 실제 녹화 | 실행 서비스와 경로 | 막힌 점 |
|---|---|---|---|---|
| 1 | 네이버 블로그 자동포스팅 | 없음 | pagemaker.ai.kr `/auto-posting`(목록), `/auto-posting/create`, `/auto-posting/{id}/naver-blog-preview`, `/auto-posting/schedule`, `/auto-posting/campaigns` | 로그인과 구독이 필요하다(`ensure.subscription`). 비로그인 접속은 `/login`으로 넘어간다. **코드상 네이버 블로그는 원고 생성과 미리보기까지만 있다.** 네이버에 직접 발행하는 코드는 찾지 못했고, 자동 발행은 인스타그램만 있다(`AutoPostingController@store`의 `publishInstagram`). |
| 2 | 인스타그램 피드 등록, 좋아요·댓글 | 없음 | pagemaker.ai.kr `/auto-posting`(즉시 발행 시 Graph API `media_publish`), `/auto-posting/{id}/instagram-preview`, `/auto-posting/analytics`(게시물별 좋아요·댓글 **수** 조회), `/auto-posting/accounts`(Facebook·Instagram 계정 연결) | 로그인과 연결된 인스타그램 계정이 필요하다. **팔로워 게시물에 좋아요나 댓글을 다는 기능은 코드에 없다**(조회만 있다). 실제 게시는 외부 게시라 이번 단계에서 하지 않았다. |
| 3 | 아바타 라이브커머스 | 참고 녹화 2개(아래). 사이트에는 넣지 않았다 | https://characterfront.vercel.app/live (비로그인 열람 가능) | 아래 아바타 확인 결과 참고 |
| 4 | 네이버광고 자동 운영 | 없음 | **찾지 못함** | 조직 저장소에서 검색광고 API(`api.searchad.naver.com`) 사용 코드가 나오지 않았다. makehtml의 `searchad`는 홈페이지 설정 화면의 문자열 하나뿐이다. 실제 운영 도구의 주소나 계정을 사용자가 알려줘야 한다. |
| 5 | 스마트스토어 리뷰·문의 판매자 답변 자동 작성 | 없음 | **찾지 못함** | makehtml의 네이버 커머스 연동은 상품 조회·동기화와 Quick Create(`/api/v1/commerce/naver/*`), 솔루션마켓 로그인(`routes/web.php` 51행 이후)뿐이다. 리뷰나 문의 답변 코드는 없다. 실제 도구 주소를 사용자가 알려줘야 한다. |
| 6 | 데이터 수집 → 마케팅 실행 → 매출 성장 시각화 | 해당 없음(생성 영상) | 생성 도구 | 유료 생성이라 하지 않았다. 제작 전 승인이 필요하다. |

## 3. 아바타 라이브 확인 결과 (characterfront.vercel.app/live)

- **움직임: 확인함**
  - 3D 모델(`/charai-proxy/assets/characters/gangwoni/model.glb`)과 제스처(`/charai-proxy/web/gestures.json`)를 불러온다.
  - 55초 녹화에서 손 흔들기, 고개, 입 모양이 계속 바뀐다. 프레임 사이 차이가 13초 이후 계속 0보다 크다.
- **방송 진행: 확인함**
  - 「소개」 버튼을 누르면 대본 자막이 차례로 나온다(예: 「짜잔! 바로 강원도 고랭지 감자예요…」).
  - 진행 점, 상품 카드(테스트 상품, 실제 결제 없음), 구매하기 버튼이 함께 보인다.
- **목소리: 아직 확인 못 함**
  - 소스상 목소리는 ElevenLabs 서버 중계(`server/routes/tts.ts`의 `/api/tts`)로 낸다. 서버를 쓸 수 없으면 브라우저 내장 음성(`src/utils/audioManager.ts`의 `speechSynthesis`)으로 대체한다.
  - Vercel 배포에서 `/api/tts/status`는 404가 아니라 앱 HTML을 돌려준다. 서버 TTS 경로가 Vercel에 배포되지 않은 것으로 보인다.
  - 헤드리스 Chromium 녹화에서는 `speechSynthesis.speak` 호출도 오디오 요청도 잡히지 않았다.
  - 소리가 나는 실제 브라우저에서 「소개」를 누르고 들리는지 확인해야 한다. 브라우저 자동재생 정책 때문에 소리는 사용자가 클릭한 뒤에만 난다(`ProductShow.tsx` 주석).
  - 목소리를 확실히 넣으려면 ElevenLabs 키를 둔 서버(Express `server.ts`)에서 띄운 화면을 녹화해야 한다.
- **참고 녹화(세션 임시 폴더, 저장소에는 넣지 않음)**
  - 대기 55초: 1440×900 webm
  - 「소개」 진행 74초: 1440×900 webm
  - Playwright 녹화라 화질과 소리가 메인 영상에 쓰기에는 부족하다. 실제 촬영 전에 동선을 확인하는 용도다.

## 촬영 계획 (실제 녹화 1~5)

공통 설정은 다음과 같다.
- 1920×1080, 30fps, 시스템 소리 포함
- 브라우저 확대 100%
- 개인정보(이메일, 전화번호, 계정명)는 테스트 계정을 쓰거나 녹화 뒤 가린다.
- 장면마다 8~12초로 쓰고, 원본은 30~60초씩 확보한다.

1. **블로그 자동포스팅** (pagemaker.ai.kr, 로그인)
   - 순서: `/auto-posting/create`에서 주제 입력 → 원고와 이미지 생성 진행 → `/naver-blog-preview`에서 결과 확인 → `/auto-posting/schedule`에서 예약 표시.
   - 실제 네이버 발행 장면이 필요하면 발행에 쓰는 별도 도구나 수동 절차를 사용자가 알려줘야 한다. 현재 코드로는 발행을 증명할 수 없다.
   - 생성 단계가 사용량을 차감한다(`check.usage:POSTING`). 기존 초안 편집 화면(`/auto-posting/{id}/edit`)으로 대신할 수 있다.
2. **인스타그램** (pagemaker.ai.kr, 로그인과 연결 계정)
   - 순서: 기존 발행 건이 있는 목록 → `instagram-preview` → `/auto-posting/analytics`에서 게시물별 좋아요·댓글 수.
   - 실제 신규 게시는 외부 게시라 사용자 승인 뒤 테스트 계정으로만 한다.
   - 「팔로워 댓글 작성」은 기능이 없어 촬영할 수 없다. 장면 설명을 「게시 후 반응 집계」로 바꾸거나, 실제 도구를 사용자가 알려줘야 한다.
3. **아바타 라이브** (characterfront /live, 로그인 없음)
   - 순서: 초기 안내에서 「초기 건너뛰고 시작하기」 → 아바타 등장(약 12초 대기) → 「소개」 클릭 → 대본 자막·제스처·상품 카드 → 오른쪽 상품 목록.
   - 실시간 채팅 전송은 방송 채팅에 남으므로, 승인 없이는 추천 질문 버튼을 누르지 않는다.
4. **네이버광고 자동 운영**: 실행 도구가 확인되지 않아 보류한다. 필요한 것은 도구 URL, 테스트 광고 계정, 「제안만 하고 반영하지 않는」 화면이 있는지 여부다.
5. **스마트스토어 답변 자동 작성**: 실행 도구가 확인되지 않아 보류한다. 필요한 것은 도구 URL과 답변 초안까지만 만들고 등록하지 않는 테스트 경로다.

## Codex 내장 브라우저에서 이어갈 항목

- **pagemaker.ai.kr 로그인**: 구독 중인 계정이 필요하다. 이 세션에는 계정이 없다.
- **characterfront /live 소리 확인**: 소리 출력이 되는 브라우저에서 「소개」 클릭.
- **사용자에게 받을 것**
  - 4·5번 실제 운영 도구의 주소
  - 1번 네이버 블로그 실제 발행 방식
  - 2번 「팔로워 댓글」 기능을 제공하는 도구
