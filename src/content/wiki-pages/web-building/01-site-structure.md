---
title: "정적 사이트의 기본 구조"
description: "소스 파일이 빌드 산출물로 바뀌고 GitHub Pages에서 공개되는 과정을 현재 lentoludens 사이트 구조를 기준으로 설명합니다."
book: "web-building"
part: "사이트의 기본 구조"
order: 1
slug: "site-structure"
published: "2026-08-17"
updated: "2026-08-17"
lastVerified: "2026-08-17"
sources:
  - title: "Project structure"
    organization: "Astro"
    url: "https://docs.astro.build/en/basics/project-structure/"
    accessed: "2026-08-17"
  - title: "What is GitHub Pages?"
    organization: "GitHub"
    url: "https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages"
    accessed: "2026-08-17"
  - title: "perust.github.io source repository"
    organization: "lentoludens"
    url: "https://github.com/perust/perust.github.io"
    accessed: "2026-08-17"
---

## 먼저 알아둘 내용

정적 사이트는 서버가 요청마다 화면을 만들어 보내는 방식이 아니라, 배포 전에 HTML, CSS, JavaScript와 이미지 같은 파일을 만들어 두고 그대로 제공하는 방식입니다. GitHub는 GitHub Pages를 저장소의 HTML, CSS, JavaScript 파일을 게시하는 정적 사이트 호스팅 서비스로 설명합니다.

Astro는 소스 파일을 읽어 배포용 파일을 생성합니다. 현재 이 사이트에서 `npm run build`를 실행하면 결과물이 `dist/` 디렉터리에 만들어집니다. GitHub Pages는 소스 디렉터리를 직접 실행하는 것이 아니라, 배포 작업이 올린 이 결과물을 방문자에게 제공합니다.

## 소스, 빌드, 공개의 순서

전체 흐름은 세 단계로 구분할 수 있습니다.

1. `src/`와 `public/`에 페이지, 글, 스타일, 이미지를 저장합니다.
2. Astro가 소스를 읽어 정적 결과물을 `dist/`에 생성합니다.
3. GitHub Actions가 검사를 통과한 `dist/`를 GitHub Pages에 배포합니다.

이 구분이 중요한 이유는 소스 파일과 공개 파일의 역할이 다르기 때문입니다. Markdown이나 Astro 컴포넌트는 작성과 유지보수를 위한 원본이고, 브라우저가 최종적으로 받는 것은 빌드된 HTML과 연결된 자산입니다.

## 현재 사이트의 주요 디렉터리

### `src/pages/`

URL이 되는 페이지를 둡니다. 예를 들어 `src/pages/about.astro`는 빌드 후 `/about/` 페이지가 됩니다. 대괄호가 들어간 파일은 콘텐츠에 따라 여러 URL을 만드는 동적 경로로 사용할 수 있습니다.

### `src/content/`

같은 구조를 반복하는 콘텐츠를 저장합니다. 블로그 글과 전자책의 장처럼 제목, 설명, 수정일 등의 공통 항목을 가진 문서를 별도 컬렉션으로 관리할 수 있습니다.

### `src/layouts/`와 `src/styles/`

여러 페이지에서 반복되는 문서 구조와 디자인을 관리합니다. 공통 헤더, 검색 메타데이터, 본문 폭, 모바일 화면 규칙을 한곳에서 고치면 이를 사용하는 페이지에 함께 반영됩니다.

### `public/`

빌드 과정에서 가공할 필요 없이 공개 루트에 복사할 파일을 둡니다. 파비콘, `robots.txt`, 이미지처럼 URL을 그대로 유지해야 하는 정적 자산이 여기에 들어갑니다.

### `dist/`

빌드 결과입니다. 직접 편집하는 원본이 아니며 다음 빌드에서 다시 만들어집니다. 수정할 내용이 있으면 `dist/`가 아니라 `src/`나 `public/`의 원본을 고쳐야 합니다.

## 정적 사이트에서 분리해야 하는 기능

정적 HTML에 공개되면 안 되는 비밀 키를 넣어서는 안 됩니다. 브라우저로 전달된 JavaScript와 환경 변수는 방문자가 확인할 수 있기 때문입니다. 인증이 필요한 쓰기 작업이나 데이터베이스 변경은 별도의 서버 또는 서버리스 API에서 처리해야 합니다.

현재 사이트의 익명 댓글도 이 원칙을 따릅니다. 화면은 GitHub Pages에서 제공하지만 댓글 저장은 Cloudflare Worker와 D1이 담당합니다. 정적 사이트는 읽기 화면과 공개 자산을 맡고, 비밀 정보와 쓰기 권한은 서버 측 경계에 남겨 둡니다.

## 확인 방법

로컬에서 다음 명령을 실행합니다.

```bash
npm run build
```

정상적으로 끝나면 `dist/index.html`, `dist/blog/index.html` 같은 결과 파일이 생깁니다. 새로 만든 페이지도 예상한 URL 경로 아래에 생성되었는지 확인해야 합니다. 빌드 성공만 확인하지 말고 생성된 HTML과 실제 브라우저 화면까지 확인하는 것이 안전합니다.

## 핵심 정리

- 작성 원본은 `src/`와 `public/`에 둡니다.
- Astro는 원본을 `dist/`의 정적 파일로 빌드합니다.
- GitHub Actions는 검사와 배포를 자동화합니다.
- GitHub Pages는 배포된 정적 파일을 공개합니다.
- 비밀 키와 쓰기 작업은 정적 페이지 밖의 서버 측 기능으로 분리합니다.
