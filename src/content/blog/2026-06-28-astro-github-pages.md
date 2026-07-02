---
title: "Astro와 GitHub Pages로 개인 블로그 만들기"
description: "서버 비용 없이 오래 운영하기 쉬운 개인 블로그를 만들기 위해 Astro와 GitHub Pages를 선택한 이유, 그리고 글을 본격적으로 쌓기 전에 먼저 갖춰 둔 기본 사이트 구조를 정리했습니다."
date: "2026-06-28"
category: "Build Note"
tags: ["Astro", "GitHub Pages", "SEO"]
---

개인 블로그를 Astro와 GitHub Pages로 만든 이유는 오래 운영하기 쉬운 조합이기 때문입니다. 서버를 따로 두지 않아도 글을 올릴 수 있고, 포트폴리오와 블로그를 한 사이트에서 함께 관리할 수 있어 손이 덜 갑니다.

![Astro GitHub Pages 블로그 작업 책상 사진 1](/images/posts/2026-06-28-astro-github-pages-01.jpg)

<small>생성된 참고 이미지입니다.</small>

## 왜 Astro인가

Astro는 정적 사이트를 가볍게 만들기에 좋습니다. 블로그 글은 Markdown으로 쓰고, 필요한 화면에만 컴포넌트를 붙일 수 있어 포트폴리오와 블로그를 한 코드베이스에서 함께 운영할 수 있습니다. 글이 늘어나도 빌드 결과는 정적 파일이라 읽는 속도가 일정하게 유지됩니다.

![Astro GitHub Pages 블로그 작업 책상 사진 2](/images/posts/2026-06-28-astro-github-pages-02.jpg)

<small>생성된 참고 이미지입니다.</small>

## 왜 GitHub Pages인가

GitHub Pages는 서버 비용 없이 정적 사이트를 배포할 수 있습니다. 개인 포트폴리오와 제작 기록을 공개하기에 충분하고, 커스텀 도메인도 연결할 수 있습니다. 저장소에 올리면 곧 배포로 이어지니 글을 쓰고 내보내는 흐름이 단순합니다.

![Astro GitHub Pages 블로그 작업 책상 사진 3](/images/posts/2026-06-28-astro-github-pages-03.jpg)

<small>생성된 참고 이미지입니다.</small>

## 먼저 챙긴 것

이번 개편에서는 글을 쌓기 전에 기본 구조부터 정리했습니다.

1. 소개 페이지
2. 문의 페이지
3. 개인정보처리방침
4. 깨진 링크 없는 사이트 구조
5. 검색엔진이 읽기 쉬운 sitemap과 robots.txt

화려한 기능보다, 글을 올렸을 때 읽기 쉽고 관리하기 쉬운 구조를 먼저 만드는 데 집중했습니다.

![Astro GitHub Pages 블로그 작업 책상 사진 4](/images/posts/2026-06-28-astro-github-pages-04.jpg)

<small>생성된 참고 이미지입니다.</small>

## 핵심 정리

- Astro는 Markdown 글쓰기와 컴포넌트를 한 사이트에서 같이 쓰게 해준다.
- GitHub Pages는 서버 비용 없이 배포하고 커스텀 도메인도 붙일 수 있다.
- 기능보다 읽기 쉽고 관리하기 쉬운 기본 구조를 먼저 갖추는 것이 오래 운영하는 핵심이다.

![Astro GitHub Pages 블로그 작업 책상 사진 5](/images/posts/2026-06-28-astro-github-pages-05.jpg)

<small>생성된 참고 이미지입니다.</small>
