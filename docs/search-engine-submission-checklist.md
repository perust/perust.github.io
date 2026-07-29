# 검색엔진 등록 체크리스트

lentoludens 블로그를 검색엔진과 답변엔진이 더 빨리 발견하도록 등록할 때 쓰는 운영 체크리스트입니다. 계정 로그인과 소유권 인증이 필요하므로 Hermes가 대신 완료할 수는 없고, 아래 항목을 사용자가 직접 확인합니다.

## 기본 URL

- 사이트: `https://perust.github.io/`
- 사이트맵: `https://perust.github.io/sitemap-index.xml`
- RSS: `https://perust.github.io/rss.xml`
- 블로그: `https://perust.github.io/blog/`

## 현재 등록 상태

- Google Search Console: 완료
- Bing Webmaster Tools: 진행 필요
- 네이버 서치어드바이저: 진행 필요

## 등록 전 확인

```bash
npm run verify:site
```

확인할 것:

- canonical, description, robots 메타가 있는가
- `og:image`, `twitter:image`가 있는가
- 글 상세에 `BlogPosting`과 `BreadcrumbList` JSON-LD가 있는가
- 카테고리/태그/주제 허브 페이지에 `CollectionPage` JSON-LD가 있는가
- RSS와 sitemap이 정상 생성되는가
- 정식 카테고리 매핑, 레거시 카테고리 호환 페이지, 태그 색인 임계값, 주제 허브 링크가 정책대로인가(`check:taxonomy`)

## Google Search Console

1. Google Search Console에서 URL prefix 또는 domain property를 추가한다.
2. GitHub Pages에서는 보통 HTML 파일 업로드 방식이 가장 단순하다.
3. 인증 파일을 받으면 `public/` 아래에 그대로 넣고 배포한다.
4. 인증 후 `Sitemaps` 메뉴에 아래를 제출한다.

```txt
https://perust.github.io/sitemap-index.xml
```

5. 새 글을 발행한 뒤에는 URL 검사로 대표 글 몇 개를 직접 요청한다.

## Bing Webmaster Tools

1. Bing Webmaster Tools에 사이트를 추가한다.
2. Google Search Console 연동 또는 HTML 파일 인증을 사용한다.
3. sitemap으로 아래 URL을 제출한다.

```txt
https://perust.github.io/sitemap-index.xml
```

4. RSS도 보조 발견 경로로 참고할 수 있다.

```txt
https://perust.github.io/rss.xml
```

## 네이버 서치어드바이저

1. 네이버 서치어드바이저에 사이트를 등록한다.
2. HTML 파일 인증을 선택하면 인증 파일을 `public/` 아래에 넣고 배포한다.
3. 사이트맵 제출에 아래 URL을 입력한다.

```txt
https://perust.github.io/sitemap-index.xml
```

4. `robots.txt`가 sitemap을 가리키는지 확인한다.

```txt
https://perust.github.io/robots.txt
```

5. 사이트 체크에서 다음 항목을 확인한다.

- 등록 URL은 `https://perust.github.io/`로 통일한다. `http://`는 HTTPS로 리다이렉트되고, `www.perust.github.io`는 GitHub Pages 호스트가 아니므로 사용하지 않는다.
- `robots.txt`는 루트에서 `200`과 `text/plain`으로 열려야 한다.
- `robots.txt`에는 `User-agent: Yeti`와 `User-agent: *` 모두 `Allow: /`가 있어야 한다.
- sitemap은 `https://perust.github.io/sitemap-index.xml`을 사용한다.
- 파비콘은 루트의 `/favicon.ico`와 `<head>`의 favicon 링크로 노출된다.

## 카테고리 통합 (2026-07-21) — NEXT MANUAL 등록 작업

블로그 전체 Git 이력에서 확인된 20개 라벨을 `src/config/taxonomy.ts`의 정식 카테고리 6개(AI / 생활금융·경제 / 자동화·만들기 / 서평 / 회고 / 일상)로 통합했다. 정식 `AI` URL은 그대로 유지되고, 나머지 19개 과거 라벨은 호환 페이지 대상이다. 현재 공개된 64개 글에 남은 라벨 외에도, 보관된 글에만 있던 `Content Strategy`, `Food`, `Maker Log`, `Science`까지 과거 URL 호환 대상으로 유지한다. 이 통합으로 카테고리 아카이브 URL 슬러그가 바뀌었고(예: `/blog/category/money/` → `/blog/category/생활금융-경제/`), 예전 URL은 크롤 안전한 호환 페이지(`noindex, follow` + 정식 아카이브로 canonical)로 남는다. 태그 아카이브는 `INDEXABLE_TAGS` allowlist에 있고 글 3개 이상일 때만 색인되도록 정책이 바뀌었고(이전엔 전부 noindex, 판정 함수는 `isIndexableTag`), 주제 허브 페이지(`/blog/topic/ai/`, `/blog/topic/생활금융-경제/`, `/blog/topic/자동화-만들기/`) 3개가 새로 생겼다. **이 문서는 아래 등록 작업이 실행됐다고 주장하지 않는다 — 계정 인증이 필요해 사용자가 직접 해야 하는 다음 단계다.**

- [ ] **NEXT MANUAL — Google Search Console**: `Sitemaps`에서 `https://perust.github.io/sitemap-index.xml`을 다시 제출한다(이미 등록되어 있어도 URL 구조가 바뀌었으므로 재제출 권장). `URL 검사` 도구로 새 주제 허브 3개(`/blog/topic/ai/`, `/blog/topic/생활금융-경제/`, `/blog/topic/자동화-만들기/`)의 색인을 직접 요청한다. 기존에 색인된 구 카테고리 URL(`/blog/category/money/` 등)이 있었다면, `URL 검사`로 새 canonical(`/blog/category/생활금융-경제/` 등)을 함께 요청해 전환을 앞당긴다.
- [ ] **NEXT MANUAL — Bing Webmaster Tools**: sitemap을 재제출한다(`https://perust.github.io/sitemap-index.xml`). 별도 URL 재검사 기능이 있다면 주제 허브 3개 URL을 제출한다.
- [ ] **NEXT MANUAL — 네이버 서치어드바이저**: `사이트맵 제출`에서 sitemap을 다시 제출한다. `웹마스터도구 > 요청 > 웹페이지 수집`에서 주제 허브 3개 URL의 수집을 요청한다.
- [ ] **NEXT MANUAL — 사후 확인**: 1~2주 뒤 `site:perust.github.io/blog/category/` 검색과 Search Console `페이지` 리포트에서 구 카테고리 URL이 정식 카테고리로 정리(canonical 반영)되는지 확인한다. 레거시 호환 페이지가 색인에 남아 있다면 `noindex` 처리가 정상 반영될 때까지 기다린다(강제 삭제 요청은 필요할 때만).

## 2차 큐레이션 보관 (2026-07-21) — 404 정책과 검색엔진 후속 신호

2차 큐레이션으로 아래 13개 글을 공개에서 내렸다(1차 확정 5편 + 저가치 콘텐츠 집중 감사에서 확정된 8편). 직접 경험 근거가 얇은 정리·요약·체크리스트 글이라 **동등한 대체 URL 이 없고**, 의미 없는 페이지로 억지 redirect 를 걸지 않는 것이 정책이다. 공개 source(`src/content/blog`)·dist·sitemap·RSS·내부 링크·public 자산에서 완전히 제거했으므로, 배포 후 이 URL 들은 **GitHub Pages 일반 404** 를 반환한다(soft 404·가짜 canonical 없음). 원본은 `content-archive/adsense-remediation/2026-07-21/` 아래에 Git 으로 보존한다. enforcement 단일 진실 소스는 `scripts/lib/second-curation-policy-anchor.mjs`의 immutable policy anchor이며, 같은 폴더의 `second-curation-manifest.json`은 사람이 읽는 선언 사본이다(`npm run check:publish-policy`가 두 정의의 정확한 일치, 보관 무결성, 13개 슬러그의 재등장을 빌드마다 검증).

- `https://perust.github.io/blog/2026-06-28-money-weekly-2026-june-week-4/`
- `https://perust.github.io/blog/2026-07-02-investment-data-records-not-emotion/`
- `https://perust.github.io/blog/2026-07-03-productivity-apps-system-first/`
- `https://perust.github.io/blog/2026-07-03-reduce-procrastination-small-tasks/`
- `https://perust.github.io/blog/2026-07-07-ai-agent-cost-power/`
- `https://perust.github.io/blog/2026-07-07-ai-chatbot-answer-verification/`
- `https://perust.github.io/blog/2026-07-07-ai-coding-tool-trust-claude-code/`
- `https://perust.github.io/blog/2026-07-07-gemini-image-generation-free/`
- `https://perust.github.io/blog/2026-07-07-kpass-card-update-checklist/`
- `https://perust.github.io/blog/2026-07-07-second-half-policy-changes-checklist/`
- `https://perust.github.io/blog/2026-07-08-kakao-card-receipt-shopping-points/`
- `https://perust.github.io/blog/2026-07-08-phone-opening-identity-check/`
- `https://perust.github.io/blog/2026-07-09-gpt-5-6-release-preview-checklist/`

**이 문서는 아래 작업이 실행됐다고 주장하지 않는다 — 계정 인증이 필요해 사용자가 직접 해야 하는 다음 단계다.**

- [ ] **NEXT MANUAL — Google Search Console**: `Sitemaps`에서 `https://perust.github.io/sitemap-index.xml`을 재제출해 제거된 URL 이 sitemap 에 없음을 재크롤링 신호로 알린다. 색인에 이미 잡혀 있던 위 13개 URL 은 `삭제(Removals) > 임시 삭제 요청`으로 임시 제거를 걸어 색인에서 빨리 내리고, 이후 크롤러가 404 를 확인하면 영구 제거된다(410이 아닌 404 라도 반복 크롤 후 제거됨). `URL 검사` 도구로 위 URL 몇 개를 조회해 "찾을 수 없음(404)" 상태가 보고되는지 확인한다.
- [ ] **NEXT MANUAL — Bing Webmaster Tools**: sitemap 재제출. URL 제거 도구(Site Explorer/URL removal)가 있으면 위 13개 URL 을 제출한다.
- [ ] **NEXT MANUAL — 네이버 서치어드바이저**: `사이트맵 제출` 재제출. `웹마스터도구 > 요청 > 웹페이지 검색 제외`가 제공되면 위 13개 URL 의 검색 제외를 요청한다.
- [ ] **NEXT MANUAL — 사후 확인**: 1~2주 뒤 Search Console `페이지` 리포트에서 위 URL 들이 "찾을 수 없음(404)"으로 정리되는지 확인한다. 외부 유입이 확인되는 링크가 있으면 그때 개별적으로 대응을 재검토한다(자동 redirect 는 여전히 걸지 않는다).

## Daum/Kakao

Daum 검색 등록은 운영 정책이 바뀔 수 있으므로, 현재 제공되는 등록/수집 요청 메뉴가 있는지 확인한다. 별도 등록 메뉴가 없으면 sitemap, RSS, 외부 링크, 정상적인 메타 태그를 유지하는 쪽이 기본 대응이다.

## 등록 후 확인

- `site:perust.github.io` 검색으로 색인 여부 확인
- 대표 글 URL을 직접 검색해 제목/description이 자연스럽게 보이는지 확인
- Slack, Discord, 카카오톡 등에서 URL을 붙여 OG 이미지가 정상 표시되는지 확인
- 새 글 발행 후 `npm run verify:seo`를 통과했는지 확인

## 주의

- 실명 노출 금지. 작성자/브랜드 표기는 `lentoludens`로 유지한다.
- 인증 파일은 공개되어도 되는 파일만 `public/`에 넣는다.
- 개인 계정, 토큰, Search Console 인증 코드 원문은 문서에 적지 않는다.
