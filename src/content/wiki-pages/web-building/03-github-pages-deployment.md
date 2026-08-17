---
title: "GitHub Pages에 자동 배포하기"
description: "Astro 빌드 결과를 GitHub Actions에서 검사하고 GitHub Pages에 배포하는 과정과 현재 사이트의 품질 게이트를 설명합니다."
book: "web-building"
part: "배포와 검증"
order: 3
slug: "github-pages-deployment"
published: "2026-08-17"
updated: "2026-08-17"
lastVerified: "2026-08-17"
sources:
  - title: "Deploy your Astro Site to GitHub Pages"
    organization: "Astro"
    url: "https://docs.astro.build/en/guides/deploy/github/"
    accessed: "2026-08-17"
  - title: "Using custom workflows with GitHub Pages"
    organization: "GitHub"
    url: "https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages"
    accessed: "2026-08-17"
  - title: "lentoludens GitHub Pages workflow"
    organization: "lentoludens"
    url: "https://github.com/perust/perust.github.io/blob/main/.github/workflows/deploy.yml"
    accessed: "2026-08-17"
---

## 배포에서 구분할 역할

Astro, GitHub Actions, GitHub Pages는 서로 다른 역할을 담당합니다.

- Astro는 소스 파일을 배포 가능한 정적 파일로 빌드합니다.
- GitHub Actions는 저장소 변경을 계기로 명령과 검사를 실행합니다.
- GitHub Pages는 Actions가 올린 정적 결과물을 공개합니다.

GitHub Pages가 Astro 소스를 직접 실행하는 것은 아닙니다. 워크플로가 의존성을 설치하고 빌드한 뒤 Pages용 아티팩트를 업로드해야 합니다.

## 가장 단순한 공식 배포 방식

Astro 공식 문서는 `.github/workflows/deploy.yml`에 공식 Astro Action을 사용하는 방식을 권장합니다. 2026년 8월 17일 확인한 예시는 다음 구성입니다.

- `actions/checkout@v7`
- `withastro/action@v6`
- `actions/deploy-pages@v5`

Action 버전은 시간이 지나면 바뀔 수 있습니다. 새 프로젝트를 만들 때는 이 페이지의 숫자를 그대로 복사하기보다 위의 Astro 공식 배포 문서에서 현재 예시를 다시 확인해야 합니다.

사용자 사이트 저장소의 이름이 `<username>.github.io`라면 루트 주소에 배포되므로 일반적으로 별도의 `base` 설정이 필요하지 않습니다. 다른 이름의 프로젝트 저장소라면 `/저장소이름/` 아래에 배포되므로 Astro의 `base` 설정이 필요합니다. `site`에는 실제 공개 주소를 지정해야 canonical URL과 사이트맵이 올바르게 생성됩니다.

## 검사가 필요한 사이트의 사용자 정의 워크플로

단순 배포 외에 여러 검사를 통과시켜야 한다면 빌드 작업을 직접 구성할 수 있습니다. GitHub 공식 문서는 사용자 정의 워크플로에서 Pages 설정, 아티팩트 업로드, 배포 작업을 분리해 사용할 수 있다고 설명합니다.

현재 lentoludens 사이트는 다음 순서로 실행합니다.

1. 저장소 전체 이력을 checkout합니다.
2. 지정된 Node.js 환경에서 `npm ci`로 잠금 파일과 일치하는 의존성을 설치합니다.
3. `npm run build`로 `dist/`를 생성합니다.
4. SEO, 광고 코드, 콘텐츠 품질, 분류 정책을 검사합니다.
5. 정책 검증 테스트와 브라우저 상호작용 테스트를 실행합니다.
6. 모든 검사가 통과한 경우에만 `dist/`를 Pages 아티팩트로 업로드합니다.
7. 별도의 배포 작업이 해당 아티팩트를 GitHub Pages에 공개합니다.

검사보다 업로드가 먼저 실행되면 잘못된 결과물이 배포 단계로 넘어갈 수 있습니다. 품질 검사는 반드시 아티팩트 업로드와 배포보다 앞에 있어야 합니다.

## 필요한 권한

GitHub Pages 배포 작업에는 최소한 다음 권한이 필요합니다.

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

`contents: read`는 저장소를 읽기 위한 권한입니다. `pages: write`와 `id-token: write`는 Pages 배포 작업에 필요합니다. 쓰기 권한을 워크플로 전체에 과도하게 부여하지 않고 필요한 범위만 선언하는 것이 안전합니다.

## 로컬에서 먼저 확인하기

푸시하기 전에 저장소가 정한 전체 검사를 실행합니다. 현재 사이트의 집계 명령은 다음과 같습니다.

```bash
npm run verify:site
npm run test:publish-policy
npm run test:browser
```

`verify:site`는 빌드와 여러 정적 검사를 묶습니다. 브라우저 테스트는 실제로 생성된 페이지를 열어 상호작용과 화면 구조를 확인합니다. 로컬 검사에 통과해도 배포 후 공개 URL을 다시 확인해야 합니다.

## 배포 결과 확인

배포 완료 여부는 GitHub Actions 실행 결과와 공개 페이지를 함께 확인합니다.

1. 푸시한 커밋과 Actions 실행의 `headSha`가 일치하는지 확인합니다.
2. build와 deploy 작업이 모두 성공했는지 확인합니다.
3. 새 URL이 HTTP 200을 반환하는지 확인합니다.
4. 제목, canonical URL, 목차와 출처가 실제 HTML에 포함되었는지 확인합니다.
5. 모바일 화면에서 메뉴와 본문이 겹치지 않는지 확인합니다.

Actions가 성공했다는 사실만으로 기대한 콘텐츠가 공개되었다고 단정할 수 없습니다. 다른 커밋의 실행일 수 있고, 캐시된 페이지를 보고 있을 수도 있으므로 공개 URL의 실제 내용을 검증해야 합니다.

## 핵심 정리

- Astro는 빌드, GitHub Actions는 자동화, GitHub Pages는 정적 파일 공개를 담당합니다.
- 간단한 사이트는 공식 Astro Action으로 배포할 수 있습니다.
- 품질 검사가 필요하면 사용자 정의 워크플로를 사용합니다.
- 검사는 아티팩트 업로드보다 먼저 실행합니다.
- 배포 후에는 실행 SHA와 공개 페이지를 직접 확인합니다.
