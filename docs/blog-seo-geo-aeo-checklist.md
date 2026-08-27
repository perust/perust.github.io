# 블로그 글 SEO / GEO / AEO 체크리스트

lentoludens 블로그에 새 글을 쓸 때 검색엔진(SEO), 생성형 검색(GEO), 답변엔진(AEO)에 잘 읽히도록 확인하는 기준이다. 한국어 글 작성을 전제로 한다. 수치·사실은 직접 확인한 것만 쓰고, 키워드를 억지로 채우지 않는다.

## 1. frontmatter

`src/content/blog/YYYY-MM-DD-slug.md` 상단에 아래 항목을 채운다.

```md
---
title: "검색 결과에 그대로 노출돼도 자연스러운 제목"
description: "이 글이 답하는 질문을 한 문장으로 요약. 검색 스니펫과 og/twitter, JSON-LD에 함께 쓰인다."
date: "2026-06-28"
updated: "2026-07-01"   # 본문을 실제로 고친 날만. 없으면 생략 (dateModified는 date로 대체)
category: "AI/IT 정보"
tags: ["Astro", "GitHub Pages"]
valueType: "experience"    # 2026-07-21 이후 새 글 필수 — experience | original-analysis | verified-guide | review
---
```

- `title`: 사람이 실제로 검색하는 표현을 우선한다. 110자 이내(JSON-LD `headline` 권장 한도). 브랜드명·날짜 나열로 늘리지 않는다.
- `description`: 글의 결론을 압축한 1문장. 120~160자 권장. 본문 첫 문단과 의미가 일치해야 한다.
- `updated`: 내용을 실제로 고쳤을 때만 추가한다. 형식적으로 날짜만 바꾸지 않는다. `updated`(없으면 `date`)는 sitemap `lastmod`에도 그대로 반영된다.
- `category`: **반드시 `src/config/taxonomy.ts`의 `CANONICAL_CATEGORIES`에 있는 정식 카테고리명 중 하나**를 그대로 쓴다(책 서평 / 미리 알아보는 책 정보 / 도서 학습 챌린지 / AI/IT 정보 / 경제 정보, 정확히 5개 유지). 새 글은 이 5개 중 가장 가까운 분류를 고른다. 분류 체계를 바꾸려면 `taxonomy.ts`와 `LEGACY_CATEGORY_MAP`, 회귀 검증을 함께 수정한다. 과거 라벨의 일괄 매핑보다 글 내용상 다른 정식 카테고리가 명확히 가까우면 `POST_CATEGORY_OVERRIDES`에 글 슬러그와 예외를 기록한다. `npm run check:taxonomy`가 정식 카테고리가 아닌 값이나 기록된 예외와 다른 값을 쓰면 빌드 검증에서 실패시킨다.
- `tags`: 글에 실제로 다룬 주제만, **1~5개**(`NEW_POST_MAX_TAGS`). 2026-07-21 이후 새 글은 tags 를 생략하거나 빈 배열로 둘 수 없다(`npm run check:taxonomy`가 실패시킨다). 또한 `src/config/taxonomy.ts`의 `CONTROLLED_TAGS`(통제 태그 어휘)에 있는 태그만 쓸 수 있다 — 새 태그가 필요하면 글 커밋에 `CONTROLLED_TAGS` 추가를 함께 넣는다(`npm run check:taxonomy`가 검증). 태그 페이지는 `INDEXABLE_TAGS` allowlist(약 10개 핵심 주제)에 있고 글이 3개 이상(`TAG_INDEX_MIN_POSTS`) 쌓였을 때만 색인(`index, follow`)되고 sitemap에 포함된다 — 판정 함수는 `isIndexableTag`(`src/config/taxonomy.ts`) 하나다. 그 외 태그 페이지는 URL 접근은 되지만 `noindex, follow`로 남고, 사이트 어디서도 내부 링크를 걸지 않는다(글 상세 사이드바에서는 텍스트로만 표시).
- `valueType`: 새 글이 제공하는 가치를 `experience | original-analysis | verified-guide | review` 중 하나로 명시한다. 이 값은 출처·구체적 근거 warning의 문맥을 정하지만, 자동 검사 통과가 사람 검토를 대신하지는 않는다.
- `editorialReview`(legacy, 선택): 기존 글을 읽기 위한 호환 필드일 뿐 사람 검토 증거가 아니다. 새 글에는 넣지 않는다. 값이 있으면 제거를 권하는 warning이 발생할 수 있으며 다른 warning을 해소하지 않는다.
- `image`(선택): OG 이미지를 글마다 직접 지정할 때만 쓴다. 생략하면 카테고리별 기본 OG 이미지(`public/og/`), 매칭되는 카테고리가 없으면 기본 이미지로 자동 대체된다.

### 카테고리·태그·주제 허브 색인 정책 (2026-07-21 통합 → 2026-07-22 2차 개편)

- 정식 카테고리는 `src/config/taxonomy.ts`의 `CANONICAL_CATEGORIES` 하나로 정확히 5개를 정의하고, 카테고리 아카이브(`/blog/category/<slug>/`)는 글이 3개 이상이면 `index, follow`, 미만이면 `noindex, follow`다(`CATEGORY_INDEX_MIN_POSTS`).
- 과거에 쓰던 카테고리 라벨(`Money`, `AI Weekly`, `금융`뿐 아니라 1차 통합의 정식 카테고리였던 `AI`, `생활금융·경제`, `자동화·만들기`, `서평`, `회고`, `일상`까지)은 `LEGACY_CATEGORY_MAP`으로 정식 카테고리에 매핑되고, 예전 URL(`/blog/category/<과거 슬러그>/`)은 자동으로 호환 페이지가 생성된다. 호환 페이지는 항상 `noindex, follow`이고 canonical이 정식 카테고리 아카이브를 가리키며 sitemap에서 제외된다 — 링크는 계속 살아있지만 색인은 정식 카테고리로만 모인다.
- 주제 허브 3개(AI / 생활금융·경제 / 자동화·만들기 표기 유지)는 `TOPIC_HUBS`로 큐레이션한 주제 허브 페이지(`/blog/topic/<slug>/`)가 따로 있다. 2차 개편 이후 허브의 대표 글은 카테고리와 무관하게 슬러그 기준으로 큐레이션하고, `categories`는 대표(CTA·역링크) 카테고리만 나타낸다. 항상 `index, follow`이며 블로그 인덱스에서 링크된다. 허브 본문과 JSON-LD ItemList에는 하위 주제별로 수동 큐레이션한 대표 글만 중복 없이 나열하고, 카테고리 전체 글은 목록 대신 카테고리 아카이브로 가는 CTA 링크로만 연결한다(카테고리 아카이브와의 중복 콘텐츠 방지).
- 태그 색인은 `isIndexableTag`(= `INDEXABLE_TAGS` allowlist ∩ 글 `TAG_INDEX_MIN_POSTS`개 이상)가 단일 판정 기준이다. sitemap(astro.config.mjs), 태그 페이지 robots, 홈·블로그 인덱스의 태그 노출, 글 상세 사이드바 링크, 검증 스크립트 기대값이 전부 이 함수를 쓴다. noindex 태그 페이지로 가는 내부 링크는 0이어야 하며 `check:content-quality`가 검증한다.
- `npm run check:taxonomy`가 정식 카테고리 매핑·아카이브 필터, 레거시 호환 페이지, 태그/허브 색인 정렬, 글 상세의 상단 카테고리 링크와 BreadcrumbList 유지, 내부용 주제 경로 UI 비노출을 빌드마다 검증한다.

### 발행 운영 정책 (2026-07-21 이후, 대량 자동 발행 재발 방지)

상수는 전부 `src/config/taxonomy.ts`에 있고, `npm run verify:site`(CI 배포 게이트 포함)가 빌드마다 검증한다. 상한을 바꾸려면 `taxonomy.ts`를 고치는 커밋이 필요하다.

- **발행 속도**: 기준일(`NEW_POST_POLICY_BASELINE` = 2026-07-21) **다음날(2026-07-22)부터의 date** 를 가진 글은 커밋 여부와 무관하게 하루 최대 `MAX_NEW_POSTS_PER_DAY`(1)편(`check:content-quality`). 여기에 더해 Git 기준 **새로 추가된 글**은 date 가 기준일 **당일(2026-07-21, 포함) 이후**면 신규 글끼리 같은 하루 1편 상한을 받는다(`check:publish-policy`). 기준일 당일 포함 그 이전 date 의 **기존 파일**은 공개 URL 보존을 위해 검사하지 않는다(grandfathering) — 기존 글은 상한 집계에 들어가지 않고, 신규 파일만 센다.
- **본문 분량**: 모든 글 본문은 공백 제외 `MIN_POST_BODY_CHARS`(2,000)자 이상.
- **태그 어휘**: 기준일 이후 새 글의 태그는 `CONTROLLED_TAGS` 안에서 1~`NEW_POST_MAX_TAGS`(5)개. tags 생략·빈 배열은 `check:taxonomy`가 빌드를 실패시킨다. 태그 아카이브 URL 표면이 글 발행만으로 늘어나지 않게 한다.
- **독자적 가치 + 사람 검토 기록**: 기준일 이후 새 글은 `valueType`(`experience` 직접 경험 / `original-analysis` 독자적 분석 / `verified-guide` 실제 검증 / `review` 서평·리뷰 중 하나)을 반드시 명시해야 하고, 없으면 `check:content-quality`가 빌드를 실패시킨다. 사람 검토는 boolean이 아니라 아래 exact-SHA 절차와 evidence record로 남긴다. 발행 전에 기존 글과 주제 중복·검색의도 잠식이 없는지 확인하고, 겹치면 새 글 대신 기존 글을 보완한다. 단순 뉴스·공식 문서 재서술만 있는 글은 발행하지 않는다 — 직접 경험, 독자적 분석, 실제 검증 중 하나가 반드시 있어야 한다(자세한 원칙은 `/editorial-policy/`).
- **홈·블로그 큐레이션**: `FEATURED_MAKER_SLUGS`(직접 제작·자동화 기록)가 홈과 블로그 인덱스에서 우선 노출되며, 슬러그 존재와 링크 노출을 `check:taxonomy`가 검증한다.
- **자기소개성 페이지 정량 주장**: 포트폴리오/소개/작업 페이지에 공개 근거 없는 "+N%", "N% 개선" 류 수치 주장이 들어오면 `check:content-quality`가 실패시킨다.

### backdate 우회 방지 — Git 신규 글 감지 (`npm run check:publish-policy`)

날짜 게이트만 있으면 새 글의 `date` 를 기준일 이전으로 적는 것(backdate)만으로 가치 유형·통제 태그 게이트를 통과시킬 수 있다. 이를 막기 위해 `scripts/check-publish-policy.mjs` 가 **Git 기준으로 새로 추가된** `src/content/blog/*.md` 를 감지해, date 가 기준일 당일 또는 그 이전이어도 아래를 강제한다(`npm run verify:site` 와 CI 배포 게이트에 포함).

- 유효한 `valueType`(`VALUE_TYPES`), `CONTROLLED_TAGS` 안의 태그 1~`NEW_POST_MAX_TAGS`(5)개, 본문 `MIN_POST_BODY_CHARS`(2,000)자 이상.
- 챗봇 서문 같은 고신뢰 잔재는 failure로 차단하고, 반복 문단·추상 평가어·출처/구체적 근거 부족은 warning으로만 출력한다. 자동 검사는 작성 주체나 AI 사용 여부를 판정하지 않는다.
- 신규 글 중 date 가 기준일 당일(포함) 이후인 글의 date 별 하루 `MAX_NEW_POSTS_PER_DAY`(1)편 상한.

"신규"의 판정은 "지금 작업 트리에 있는데 기준선(baseline) 커밋 트리에 없으면 신규"라서, 아직 커밋 전 untracked 파일, 스테이징된 파일, 이미 커밋된 파일이 모두 잡힌다. 기준선 커밋은 이 순서로 해석한다(`scripts/lib/git-policy.mjs`):

1. `POLICY_GIT_BASELINE` 환경변수 — CI(deploy.yml)가 push 이전 커밋(`github.event.before`)을 넘긴다. all-zero SHA·해석 불가 값이면 경고 후 다음 후보로.
2. `merge-base(HEAD, @{upstream})` — 일반 로컬 checkout.
3. `merge-base(HEAD, origin/main)` — upstream 미설정 시.
4. `HEAD` — 원격 없는 저장소(fixture 등). 이때는 커밋 전 변경만 잡힌다.

검증기 자체는 fixture negative 테스트(`npm run test:publish-policy`)가 임시 git 저장소에서 backdate·게이트 누락·상한 초과·보관 변조·재등장 케이스가 실제로 실패하는지 확인한다.

### exact-SHA 사람 검토와 warning 처리

1. **후보 고정**: 검토할 exact Git `head_ref`와 대상 글 경로를 기록한다. 검토 후 후보 bytes가 바뀌면 이전 판정은 만료된다.
2. **fresh-session 전체 읽기**: 새 세션에서 title, description, frontmatter, 본문, 링크·이미지 문맥을 처음부터 끝까지 읽는다.
3. **맥락별 근거 확인**: `original-analysis`·`verified-guide`는 핵심 주장과 외부 원문을 대조한다. `experience`는 실제 과정·화면·출력·수치 같은 firsthand 근거를 확인한다. 텍스트 자체가 가치인 `review`에는 불필요한 링크·수치를 만들지 않는다.
4. **warning disposition**: `duplicate-prose-block`, `abstract-evaluation-density`, `research-source-gap`, `experience-support-scarcity`, `legacy-editorial-review-flag`를 각각 수정, 근거가 있어 유지, 오탐 중 하나로 처리하고 이유를 남긴다. 경고를 없애기 위해 출처·수치·경험을 지어내지 않는다.
5. **추천과 evidence record**: 발행(publish), 수정 후 재검토(revise), 보류(hold) 중 하나를 정하고, `head_ref`, fresh-session/로그 경로, warning 처리표, 출처 확인 결과를 한 기록에 묶는다.

### 2차 큐레이션 immutable policy anchor와 보관 선언

2차 큐레이션(2026-07-21)으로 공개에서 내린 13개 글의 enforcement 단일 진실 소스는 `scripts/lib/second-curation-policy-anchor.mjs`의 immutable policy anchor다. `content-archive/adsense-remediation/2026-07-21/second-curation-manifest.json`은 사람이 읽는 보관 선언 사본이며, 고정 13개 slug와 42개 payload의 경로·kind·sha256 및 404 정책을 anchor와 정확히 일치시켜야 한다. `check:publish-policy`가 이 일치 여부와 보관 파일 존재·Git 추적 가능 상태·체크섬·원본 공개 경로 삭제·소스/dist/sitemap/RSS/내부 링크/public 자산 재등장을 검증한다. 제거된 URL의 404 정책과 Search Console 후속 작업은 [`search-engine-submission-checklist.md`](search-engine-submission-checklist.md)를 따른다.

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
- `blog/[slug].astro`: `BlogPosting` JSON-LD(headline, description, datePublished, dateModified, author/publisher=lentoludens, mainEntityOfPage, articleSection, keywords, inLanguage=ko-KR)와 `BreadcrumbList` JSON-LD(홈 > 블로그 > 카테고리 > 글).
- `blog/index.astro`: `Blog` + `blogPost` JSON-LD. `index.astro`: `WebSite` JSON-LD.
- `astro.config.mjs`의 sitemap 통합이 `sitemap-index.xml`을 만들고 `robots.txt`가 이를 가리킨다.
- `src/pages/rss.xml.ts`가 블로그 글(title/description/pubDate/link/categories)을 모아 `/rss.xml` 피드를 만든다. 작성자는 `lentoludens`로만 표기한다.
- OG 이미지는 `frontmatter.image`가 있으면 그 값을 쓰고, 없으면 글별 생성 이미지(`/public/og/posts/<slug>.png`)를, 없으면 카테고리 기본 이미지(`/public/og/`)를, 매칭되는 카테고리가 없으면 `/og/default.png`를 쓴다.
- 글별 OG 이미지는 `python3 scripts/generate-og.py`로 생성한다. 새 글을 추가했다면 배포 전 이 스크립트를 한 번 실행해 `public/og/posts/`에 PNG가 생겼는지 확인한다.
- 카테고리·태그·주제 허브는 `/blog/category/<slug>/`, `/blog/tag/<slug>/`, `/blog/topic/<slug>/` 정적 페이지로 생성되고 `CollectionPage` + `BreadcrumbList` JSON-LD가 붙는다.
- `npm run verify:seo`가 og/twitter 이미지, RSS, BlogPosting/BreadcrumbList/CollectionPage 구조화 데이터까지 점검하고, `npm run verify:site`(빌드 + 4개 체커)는 여기에 더해 `npm run check:taxonomy`로 카테고리/태그/허브 색인 정책까지 점검한다.

검색엔진 등록은 계정 인증이 필요하다. Google Search Console, Bing Webmaster Tools, 네이버 서치어드바이저 등록 절차는 [`search-engine-submission-checklist.md`](search-engine-submission-checklist.md)를 따른다.

따라서 글쓴이는 **frontmatter를 정확히 채우는 것**이 곧 스키마 품질로 이어진다.

## 9. 하지 말 것

- 키워드 스터핑(같은 단어 반복, 태그 남발).
- 광고성·수익화 유도 문구, 과장 표현.
- 공개 실명 노출. 글쓴이 표기는 브랜드명 `lentoludens`로 통일한다.
- 기존 글의 수치·사실을 근거 없이 수정.

## 10. 발행 전 확인

- [ ] exact `head_ref`를 고정하고 fresh-session 전체 읽기 evidence record를 남겼는가
- [ ] 모든 editorial-quality warning을 수정·근거 유지·오탐 중 하나로 처리하고 이유를 기록했는가
- [ ] `npm run check`와 `npm run build` 통과
- [ ] 제목·description·첫 문단이 같은 질문에 답하는가
- [ ] H2/H3 구조와 섹션별 결론 문장이 있는가
- [ ] 수치·인용에 1차 출처 링크가 있는가
- [ ] FAQ는 실제 질문이 있을 때만 넣었는가
- [ ] 키워드 스터핑·과장·실명 노출이 없는가
