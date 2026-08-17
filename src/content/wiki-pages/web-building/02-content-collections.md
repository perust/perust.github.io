---
title: "콘텐츠를 구조화해서 관리하기"
description: "Astro 콘텐츠 컬렉션으로 같은 형식의 문서를 묶고 스키마, 출처, 검증일을 필수로 관리하는 방법을 설명합니다."
book: "web-building"
part: "콘텐츠 관리"
order: 2
slug: "content-collections"
published: "2026-08-17"
updated: "2026-08-17"
lastVerified: "2026-08-17"
sources:
  - title: "Content collections"
    organization: "Astro"
    url: "https://docs.astro.build/en/guides/content-collections/"
    accessed: "2026-08-17"
  - title: "Content collection APIs"
    organization: "Astro"
    url: "https://docs.astro.build/en/reference/modules/astro-content/"
    accessed: "2026-08-17"
---

## 콘텐츠 컬렉션이 필요한 경우

Astro의 콘텐츠 컬렉션은 동일한 구조를 공유하는 문서 묶음을 관리하는 기능입니다. 공식 문서는 블로그 글, 제품 설명, 문서처럼 반복되는 콘텐츠를 컬렉션으로 관리하면 조회, 편집기 자동 완성, 형식 검사와 TypeScript 타입 안전성을 함께 얻을 수 있다고 설명합니다.

위키의 책에는 여러 장이 있지만 각 장은 제목, 설명, 책 식별자, 순서, 수정일, 검증일, 출처처럼 같은 항목을 가집니다. 파일마다 항목 이름을 다르게 적으면 목차 순서가 깨지거나 출처가 빠질 수 있으므로 스키마로 형식을 고정하는 편이 적합합니다.

## 책과 장을 분리하는 이유

이 사이트의 위키는 두 컬렉션을 사용합니다.

- `wikiBooks`: 책 제목, 설명, 버전, 대상 독자, 학습 목표를 관리합니다.
- `wikiPages`: 각 장의 제목, 소속 책, 부, 순서, URL, 수정일, 검증일, 출처를 관리합니다.

책 정보와 장 본문을 분리하면 책 소개를 매 장에 반복하지 않아도 됩니다. 새로운 지식을 알게 되었을 때는 기존 책의 목차 아래 장 파일 하나를 추가하고, 책의 수정일과 버전만 함께 갱신할 수 있습니다.

## 최신 방식으로 컬렉션 정의하기

Astro의 현재 공식 문서는 빌드 시점 컬렉션에 `loader`를 지정하는 방식을 안내합니다. 로컬 Markdown과 JSON 파일은 `astro/loaders`의 `glob()` 로더로 가져올 수 있습니다.

아래 TypeScript는 기존 `src/content.config.ts`에서 `wikiPages` 정의만 설명하기 위해 축약한 부분 예제입니다. 기존 `blog`와 `wikiBooks` 정의 및 등록은 그대로 유지해야 합니다.

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const wikiPages = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/wiki-pages',
  }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(40),
    book: z.string().min(1),
    part: z.string().min(1),
    order: z.number().int().positive(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    lastVerified: z.coerce.date(),
    sources: z.array(z.object({
      title: z.string().min(1),
      organization: z.string().min(1),
      url: z.string().url(),
      accessed: z.coerce.date(),
    })).min(1),
  }),
});
```

`wikiPages`를 정의한 뒤에는 기존 컬렉션을 지우지 말고 등록 객체에 새 키만 추가합니다.

```diff
-export const collections = { blog, wikiBooks };
+export const collections = { blog, wikiBooks, wikiPages };
```

`export const collections = { wikiPages }`처럼 등록 객체 전체를 바꾸면 기존 블로그와 책 메타데이터 컬렉션이 해제되므로 사용하지 않습니다.

`z.object()` 안의 규칙을 만족하지 않는 문서가 있으면 콘텐츠 동기화나 빌드 단계에서 오류가 발생합니다. 출처가 하나도 없는 장이나 숫자가 아닌 순서를 조용히 공개하는 대신 배포 전에 중단시킬 수 있습니다.

## 장 파일 작성하기

각 장은 앞부분의 frontmatter와 본문으로 나뉩니다.

```md
---
title: "새 장 제목"
description: "공식 출처와 검증일을 포함해 새 장을 안전하게 추가하고 배포 전에 형식을 확인하는 방법을 설명합니다."
book: "web-building"
part: "운영과 유지보수"
order: 4
slug: "new-chapter"
published: "2026-08-17"
updated: "2026-08-17"
lastVerified: "2026-08-17"
sources:
  - title: "공식 문서 제목"
    organization: "공식 기관"
    url: "https://example.com/official-document"
    accessed: "2026-08-17"
---

## 첫 소제목

검증한 내용을 작성합니다.
```

`published`는 장을 처음 공개한 날이며 이후 수정해도 바꾸지 않습니다. `updated`는 본문을 실제로 수정한 날이고 `lastVerified`는 설명과 절차가 공식 출처 및 실행 결과와 맞는지 마지막으로 확인한 날입니다. 문장만 다듬은 경우와 기술 내용의 유효성을 다시 확인한 경우를 구분할 수 있습니다.

같은 `part`의 장은 전역 `order`에서 연속되어야 합니다. 기존 중간 부에 장을 넣는다면 그 뒤 장들의 `order`를 함께 조정하고, 책 끝에 이어지는 새 주제라면 예제처럼 새 부와 다음 순서를 사용합니다.

## 컬렉션 읽기와 URL 만들기

페이지에서는 `getCollection()`으로 장을 가져온 뒤 순서대로 정렬합니다.

```ts
import { getCollection } from 'astro:content';

const pages = (await getCollection('wikiPages'))
  .filter((page) => page.data.book === 'web-building')
  .sort((a, b) => a.data.order - b.data.order);
```

정적 사이트에서 콘텐츠별 URL을 만들 때는 `getStaticPaths()`가 각 장의 경로와 데이터를 반환합니다. 빌드 시점에 모든 장의 HTML이 생성되므로 방문 시 데이터베이스를 조회하지 않아도 됩니다.

## 새 지식을 추가하는 절차

1. 새 내용이 기존 책의 범위에 들어가는지 확인합니다.
2. 가장 가까운 부를 선택하고 같은 부의 장이 `order`에서 연속되도록 이후 순서를 조정합니다.
3. 공식 출처와 실제 확인한 날짜를 기록합니다.
4. 기존 장과 겹치는 설명은 합치거나 상호 링크합니다.
5. 빌드와 위키 테스트를 실행합니다.
6. 데스크톱과 모바일에서 목차 순서를 확인합니다.

처음부터 빈 주제를 많이 만들 필요는 없습니다. 현재 설명할 수 있고 출처를 확인한 내용만 장으로 추가하면 됩니다.

## 핵심 정리

- 반복되는 문서는 콘텐츠 컬렉션으로 구조를 통일합니다.
- 책 메타데이터와 장 본문은 서로 다른 컬렉션으로 분리합니다.
- 스키마가 출처, 검증일, 순서 누락을 배포 전에 차단합니다.
- 새로운 지식은 기존 큰 범위의 책 아래 장으로 추가합니다.
