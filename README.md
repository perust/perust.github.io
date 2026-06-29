# perust.github.io

slowave의 개인 홈페이지이자 Astro 기반 포트폴리오/블로그입니다. 메인 페이지에는 현재 관심사, 프로젝트, 작업 원칙, 과거 퍼블리싱/프론트엔드 실습 결과물을 정리하고, `/blog`에는 제작기와 실험 기록을 Markdown으로 쌓습니다.

## 주요 내용

- 개인 소개 및 현재 포커스
- 진행 중인 프로젝트 카드
- Markdown 기반 블로그
- 소개, 문의, 개인정보처리방침 페이지
- sitemap, robots.txt, RSS 피드(`/rss.xml`) 등 검색·구독 노출을 위한 기본 파일
- 과거 웹 퍼블리싱·JavaScript 실습 아카이브 보존
- Cloudflare Worker/D1 기반 익명 댓글 초안

## 프로젝트 구조

```text
.
├── src/
│   ├── content/blog/        # Markdown 블로그 글
│   ├── layouts/             # Astro 공통 레이아웃
│   ├── pages/               # 라우트 페이지
│   └── styles/              # 전역 스타일
├── public/
│   ├── contents/            # 기존 게임/프로그램 실습 콘텐츠
│   ├── homepage/            # 기존 퍼블리싱 실습 아카이브
│   ├── study/               # 기존 강의·학습 결과물
│   ├── robots.txt
├── comments-worker/          # 익명 댓글 Worker/D1 초안
├── astro.config.mjs
└── .github/workflows/deploy.yml
```

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:4321`에 접속합니다.

## 빌드 검증

```bash
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

배포 전 SEO/GEO/AEO 메타와 JSON-LD 누락을 한 번에 점검하려면 `npm run verify:seo`(빌드 후 `scripts/check-seo.mjs` 실행, 누락 시 종료 코드 1)를 실행합니다.

## 블로그 글 작성

`src/content/blog/YYYY-MM-DD-slug.md` 파일을 추가합니다.

```md
---
title: "글 제목"
description: "검색 결과와 글 목록에 표시될 요약"
date: "2026-06-28"
category: "Build Note"
tags: ["Astro", "GitHub Pages"]
---

본문을 Markdown으로 작성합니다.
```

검색엔진(SEO)·생성형 검색(GEO)·답변엔진(AEO)에 잘 읽히도록 글을 쓰는 기준은 [`docs/blog-seo-geo-aeo-checklist.md`](docs/blog-seo-geo-aeo-checklist.md)에 정리해 두었습니다. 메타 태그와 JSON-LD 구조화 데이터(`BlogPosting`·`BreadcrumbList` 포함), `/rss.xml` RSS 피드는 레이아웃과 엔드포인트에서 자동 생성되므로, 글쓴이는 frontmatter를 정확히 채우는 데 집중하면 됩니다.

## 배포

GitHub Actions가 `main` 브랜치 push 시 Astro 사이트를 빌드하고 GitHub Pages에 배포합니다.

> 기존 GitHub Pages 설정이 `main / root` legacy 배포라면, Astro 전환 후에는 GitHub Pages source를 **GitHub Actions**로 변경해야 합니다.

## 댓글 기능

`comments-worker/`에는 Cloudflare Worker + D1 기반 익명 댓글 API 초안이 있습니다.

- 댓글은 기본적으로 승인 대기 상태로 저장됩니다.
- IP 원문은 저장하지 않고 해시와 일부 마스킹된 prefix만 저장합니다.
- 운영 배포 전 Cloudflare D1, Turnstile, Worker secret 설정이 필요합니다.

자세한 설정은 `comments-worker/README.md`를 참고합니다.

## 아카이브

기존 `contents/`, `homepage/`, `study/` 콘텐츠는 `public/` 아래로 이동해 배포 결과물에 그대로 포함되도록 했습니다. 메인 페이지는 최신 자기소개/프로젝트/블로그 허브 역할을 하고, 하위 폴더는 과거 작업물을 참고하기 위한 아카이브로 사용합니다.
