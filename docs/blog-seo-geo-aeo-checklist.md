# 블로그 글 SEO / GEO / AEO 체크리스트

slowave 블로그에 새 글을 쓸 때 검색엔진(SEO), 생성형 검색(GEO), 답변엔진(AEO)에 잘 읽히도록 확인하는 기준이다. 한국어 글 작성을 전제로 한다. 수치·사실은 직접 확인한 것만 쓰고, 키워드를 억지로 채우지 않는다.

## 1. frontmatter

`src/content/blog/YYYY-MM-DD-slug.md` 상단에 아래 항목을 채운다.

```md
---
title: "검색 결과에 그대로 노출돼도 자연스러운 제목"
description: "이 글이 답하는 질문을 한 문장으로 요약. 검색 스니펫과 og/twitter, JSON-LD에 함께 쓰인다."
date: "2026-06-28"
updated: "2026-07-01"   # 본문을 실제로 고친 날만. 없으면 생략 (dateModified는 date로 대체)
category: "Build Note"
tags: ["Astro", "GitHub Pages"]
---
```

- `title`: 사람이 실제로 검색하는 표현을 우선한다. 110자 이내(JSON-LD `headline` 권장 한도). 브랜드명·날짜 나열로 늘리지 않는다.
- `description`: 글의 결론을 압축한 1문장. 120~160자 권장. 본문 첫 문단과 의미가 일치해야 한다.
- `updated`: 내용을 실제로 고쳤을 때만 추가한다. 형식적으로 날짜만 바꾸지 않는다. `updated`(없으면 `date`)는 sitemap `lastmod`에도 그대로 반영된다.
- `tags`: 글에 실제로 다룬 주제만. 4~8개 정도. 같은 단어 변형을 반복하지 않는다(키워드 스터핑 금지).
- `image`(선택): OG 이미지를 글마다 직접 지정할 때만 쓴다. 생략하면 카테고리별 기본 OG 이미지(`public/og/`), 매칭되는 카테고리가 없으면 기본 이미지로 자동 대체된다.

## 2. 제목 (검색 제목)

- 핵심 키워드를 앞쪽에 둔다.
- 클릭을 유도하는 과장·낚시 표현은 쓰지 않는다.
- 주간 정리류는 `기간 + 주제` 패턴을 유지해 일관성을 둔다. 예: `2026년 6월 4주차 경제·재테크 주간 정리: …`.

## 3. 첫 문단 = 답변형 요약 (AEO 핵심)

- 글 맨 위 1문단에서 "이 글이 답하는 질문"에 바로 답한다. 서론·인사로 시작하지 않는다.
- 답변엔진과 생성형 검색이 그대로 인용할 수 있도록, 결론을 먼저 쓰고 근거를 뒤에 붙인다.
- 가능하면 첫 문단을 `description`과 의미가 겹치되 표현은 다르게 쓴다.

## 4. 본문 구조 (H2/H3)

- `#`(H1)은 제목 한 번만. Astro가 `title`을 H1로 렌더링하므로 본문 Markdown은 `##`(H2)부터 시작한다.
- H2는 독자가 검색할 법한 하위 질문 단위로 나눈다. H3는 그 안의 세부 항목.
- 한 H2 아래 첫 문장은 그 섹션의 결론을 담아, 부분 인용에도 의미가 통하게 한다.
- 핵심 요약·체크리스트·비교는 리스트나 표로 정리하면 발췌·인용이 쉬워진다(이미 있는 카드/요약 구조는 유지).

## 5. 출처 링크 (GEO 신뢰도)

- 수치·인용·주장에는 1차 출처(공식 발표, 기관 자료, 원문)를 직접 링크한다.
- 출처는 본문에서 어떤 자료인지 밝힌다. 예: "한국은행 기준금리", "Yahoo Finance 일별 시세".
- 추정·해석은 사실과 분리해 표시한다. 확인 못 한 수치는 쓰지 않는다.

## 6. 짧은 결론 문장 (인용 가능성)

- 각 섹션과 글 끝에 한 문장짜리 결론을 둔다. 생성형 검색이 인용하기 좋은 단위다.
- "결국 ~다", "이번 주 핵심은 ~다" 같은 자족적인 문장으로 맺는다.
- 한 문장에 조건·예외를 욱여넣지 말고, 필요하면 다음 문장으로 분리한다.

## 7. FAQ

- 실제로 자주 받는 질문이 있을 때만 FAQ 섹션을 만든다. 없으면 만들지 않는다.
- 억지 자문자답은 품질을 떨어뜨리고 스팸으로 보일 수 있다.
- FAQ를 넣을 때 질문은 H3, 답은 1~2문장으로 짧게. (FAQPage JSON-LD가 필요하면 그때 별도 추가 검토.)

## 8. 메타·스키마는 자동 적용된다

이 저장소는 아래를 자동 생성하므로 글마다 따로 손댈 필요는 없다.

- `BaseLayout.astro`: canonical, robots, description, og(title/description/url/type/site_name/locale), twitter(card/title/description), generator, RSS alternate 링크(`/rss.xml`).
- `blog/[slug].astro`: `BlogPosting` JSON-LD(headline, description, datePublished, dateModified, author/publisher=slowave, mainEntityOfPage, articleSection, keywords, inLanguage=ko-KR)와 `BreadcrumbList` JSON-LD(홈 > 블로그 > 카테고리 > 글).
- `blog/index.astro`: `Blog` + `blogPost` JSON-LD. `index.astro`: `WebSite` JSON-LD.
- `astro.config.mjs`의 sitemap 통합이 `sitemap-index.xml`을 만들고 `robots.txt`가 이를 가리킨다.
- `src/pages/rss.xml.ts`가 블로그 글(title/description/pubDate/link/categories)을 모아 `/rss.xml` 피드를 만든다. 작성자는 `slowave`로만 표기한다.
- OG 이미지는 `frontmatter.image`가 있으면 그 값을 쓰고, 없으면 글별 생성 이미지(`/public/og/posts/<slug>.png`)를, 없으면 카테고리 기본 이미지(`/public/og/`)를, 매칭되는 카테고리가 없으면 `/og/default.png`를 쓴다.
- 글별 OG 이미지는 `python3 scripts/generate-og.py`로 생성한다. 새 글을 추가했다면 배포 전 이 스크립트를 한 번 실행해 `public/og/posts/`에 PNG가 생겼는지 확인한다.
- 카테고리·태그는 `/blog/category/<slug>/`, `/blog/tag/<slug>/` 정적 페이지로 생성되고 `CollectionPage` + `BreadcrumbList` JSON-LD가 붙는다.
- `npm run verify:seo`가 og/twitter 이미지, RSS, BlogPosting/BreadcrumbList/CollectionPage 구조화 데이터까지 점검한다.

검색엔진 등록은 계정 인증이 필요하다. Google Search Console, Bing Webmaster Tools, 네이버 서치어드바이저 등록 절차는 [`search-engine-submission-checklist.md`](search-engine-submission-checklist.md)를 따른다.

따라서 글쓴이는 **frontmatter를 정확히 채우는 것**이 곧 스키마 품질로 이어진다.

## 9. 하지 말 것

- 키워드 스터핑(같은 단어 반복, 태그 남발).
- 광고성·수익화 유도 문구, 과장 표현.
- 공개 실명 노출. 글쓴이 표기는 브랜드명 `slowave`로 통일한다.
- 기존 글의 수치·사실을 근거 없이 수정.

## 10. 발행 전 확인

- [ ] `npm run build` 통과
- [ ] 제목·description·첫 문단이 같은 질문에 답하는가
- [ ] H2/H3 구조와 섹션별 결론 문장이 있는가
- [ ] 수치·인용에 1차 출처 링크가 있는가
- [ ] FAQ는 실제 질문이 있을 때만 넣었는가
- [ ] 키워드 스터핑·과장·실명 노출이 없는가
