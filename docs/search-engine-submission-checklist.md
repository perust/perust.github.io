# 검색엔진 등록 체크리스트

slowave 블로그를 검색엔진과 답변엔진이 더 빨리 발견하도록 등록할 때 쓰는 운영 체크리스트입니다. 계정 로그인과 소유권 인증이 필요하므로 Hermes가 대신 완료할 수는 없고, 아래 항목을 사용자가 직접 확인합니다.

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
npm run verify:seo
```

확인할 것:

- canonical, description, robots 메타가 있는가
- `og:image`, `twitter:image`가 있는가
- 글 상세에 `BlogPosting`과 `BreadcrumbList` JSON-LD가 있는가
- 카테고리/태그 페이지에 `CollectionPage` JSON-LD가 있는가
- RSS와 sitemap이 정상 생성되는가

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

## Daum/Kakao

Daum 검색 등록은 운영 정책이 바뀔 수 있으므로, 현재 제공되는 등록/수집 요청 메뉴가 있는지 확인한다. 별도 등록 메뉴가 없으면 sitemap, RSS, 외부 링크, 정상적인 메타 태그를 유지하는 쪽이 기본 대응이다.

## 등록 후 확인

- `site:perust.github.io` 검색으로 색인 여부 확인
- 대표 글 URL을 직접 검색해 제목/description이 자연스럽게 보이는지 확인
- Slack, Discord, 카카오톡 등에서 URL을 붙여 OG 이미지가 정상 표시되는지 확인
- 새 글 발행 후 `npm run verify:seo`를 통과했는지 확인

## 주의

- 실명 노출 금지. 작성자/브랜드 표기는 `slowave`로 유지한다.
- 인증 파일은 공개되어도 되는 파일만 `public/`에 넣는다.
- 개인 계정, 토큰, Search Console 인증 코드 원문은 문서에 적지 않는다.
