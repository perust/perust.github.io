---
title: "[바이브 엔지니어링] 길벗 챌린지 2주차 후기: AI가 빨라질수록 더 천천히 확인해야 할까"
description: "제이킴의 바이브 엔지니어링 4–6장을 읽으며 코드 인스펙션, 요구사항 정의, HLD와 LLD를 내 AI 개발 방식에 어떻게 적용할지 생각한 길벗 챌린지 2주차 후기."
date: "2026-08-09"
category: "도서 학습 챌린지"
tags: ["AI코딩", "바이브코딩", "개발도구", "생산성", "회고"]
editorialReview: true
valueType: "experience"
---

길벗 도서 챌린지 『바이브 엔지니어링』 2주차에는 4장 코드 인스펙션부터 6장 시스템 아키텍처 설계까지 읽었습니다.<br />
이번 범위는 AI가 빠르게 만든 결과 앞에서 내가 어떤 역할을 해야 하는지를 계속 묻게 했습니다.

<img src="/images/posts/vibe-engineering-week2/book-cover-reading.webp" alt="태블릿 화면에 표시된 바이브 엔지니어링 표지" width="1200" height="1600" loading="lazy" style="max-width: 540px; margin: 0 auto;" />

<small style="text-align: center;">태블릿으로 읽은 『바이브 엔지니어링』</small>

<div class="routine-kv">
  <div><dt>읽은 범위</dt><dd>4장 코드 인스펙션부터 6장 시스템 아키텍처 설계까지</dd></div>
  <div><dt>남은 질문</dt><dd>AI가 빨라질수록 나는 무엇을 더 꼼꼼하게 봐야 할까?</dd></div>
</div>

## AI가 빨라질수록 나는 더 천천히 확인해야 할까

4장에서 말하는 코드 인스펙션은 코드를 실행하지 않고 눈으로 읽으며 의도와 흐름, 전제와 제약을 파악하는 과정입니다. 이 코드가 무엇을 하려고 만들어졌는지, 어떤 조건에서 정상적으로 동작하는지, 그 조건이 실제 환경에서도 항상 성립하는지를 확인합니다. 모든 코드를 막연히 의심하는 것이 아니라 문제가 생길 만한 지점을 좁혀 가는 일에 가깝습니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="바이브 엔지니어링 4장과 코드 인스펙션 독서 화면" tabindex="0">
    <img src="/images/posts/vibe-engineering-week2/chapter4-overview.webp" alt="디버깅과 코드 인스펙션을 다루는 바이브 엔지니어링 4장 목차" width="1200" height="1600" loading="lazy" style="width: min(82vw, 620px); height: min(120vw, 520px); max-height: 520px; object-fit: contain;" />
    <img src="/images/posts/vibe-engineering-week2/code-inspection-page.webp" alt="코드 인스펙션의 의미를 설명하는 바이브 엔지니어링 본문" width="1200" height="1600" loading="lazy" style="width: min(82vw, 620px); height: min(120vw, 520px); max-height: 520px; object-fit: contain;" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 2</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

에러가 발생했다면 증상과 조건, 로그, 내 가설을 모아 구체적으로 좁혀 가야 합니다. 코드가 이해되지 않으면 각 함수가 어떤 역할을 하는지, 언제 호출되는지, 어떤 상태가 바뀌는지를 계속 물어볼 수 있습니다. 핵심은 처음부터 "고쳐 줘"라고 하기보다 "분석해 줘"라고 요청하는 것입니다. 이해가 선행되어야 AI가 내놓은 수정이 적절한지도 판단할 수 있기 때문입니다.

솔직히 말하면 지금의 높은 사고 능력을 가진 AI는 원인을 물어보기만 해도 꽤 깊게 분석하고, 해결한 다음 예방 조치까지 진행합니다. 예전보다 확실하게 작업해준다는 느낌은 들지만, 정말 어느 정도까지 안전하게 해결했는지는 잘 모르기도 합니다. 그래서 AI와 함께 코드와 환경, 로직, 전제조건과 한계를 확인하며 문제를 토론하듯 나아가면 해결의 정확성이 더 올라갈 것 같습니다.

그러나 "이해하지 못한 코드는 커밋하지 말라"는 말을 보자마자 든 생각은 "아, 솔직히 감당이 가능한가?"였습니다. AI는 코드를 너무 빠르게 작성하고, Auto mode에서는 작은 과정들을 알아서 확인하며 결과가 나올 때까지 진행합니다. 잠시 다른 일을 하고 돌아오면 수많은 작업이 이미 끝나 있습니다. 변경 내용을 쭉 읽어보기는 해도 코드를 모두 확인하지는 못합니다.

그렇게 프로젝트가 크고 복잡해질수록 자잘한 문제가 늘고, 내가 방향을 확실히 잡기 어려워지는 것도 맞는 것 같습니다. 인간이 병목이라고 해서 빨리 승인하고 방향만 제시하는 것이 답은 아닐 수 있습니다. 오히려 더 천천히 확인하면서, 결정과 승인만 내리는 대표가 아니라 코드를 꼼꼼히 보는 개발팀 팀장이나 시니어 개발자, CTO 같은 역할로 가야 하는 것은 아닐까 생각했습니다.

## 프롬프트를 투머치토커처럼 써도 되지 않을까

5장의 핵심은 "프롬프트는 요구사항 정의서다"라는 말이었습니다. 왜 이 기능이 필요한지, 무엇을 해야 하는지, 어디까지 만들 것인지, 어떤 제약을 지켜야 하는지, 무엇을 실패로 보고 언제 완료됐다고 할 것인지를 정의해야 AI도 내가 원하는 방향으로 움직일 수 있습니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="바이브 엔지니어링 2부와 5장 독서 화면" tabindex="0">
    <img src="/images/posts/vibe-engineering-week2/part2-intro.webp" alt="지휘의 기술 AI와 함께 만드는 법이라는 바이브 엔지니어링 2부 표지" width="1200" height="1600" loading="lazy" style="width: min(82vw, 620px); height: min(120vw, 520px); max-height: 520px; object-fit: contain;" />
    <img src="/images/posts/vibe-engineering-week2/chapter5-overview.webp" alt="프롬프트와 요구사항 정의를 다루는 바이브 엔지니어링 5장 목차" width="1200" height="1600" loading="lazy" style="width: min(82vw, 620px); height: min(120vw, 520px); max-height: 520px; object-fit: contain;" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 2</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

웹 서비스를 만든다고 해도 경험과 지식이 없다면 호출 수를 볼지, 비용과 에러율을 볼지, 어떤 필터 조건과 예외를 확인할지 떠올리기 어렵습니다. "이런 것을 만들고 싶다"는 생각만으로는 상세한 조건까지 나오지 않습니다. 그렇기 때문에 AI 시대에도 개발자의 경험과 지식이 더욱 중요하지 않을까 생각했습니다. 참 벽은 높고 높습니다.

그래서 음성으로 개발하는 흐름도 나오는 것 같습니다. 세션에서 주절주절 말하다 보면 AI가 그 안에서 원하는 바와 필요한 조건, 환경과 기능을 찾아냅니다. 그렇다면 음성뿐 아니라 글로 프롬프트를 쓸 때도 어느 정도 정리해서 투머치토커처럼 말해도 되는 것 아닐까요? 긴 대화를 이해시키는 데 토큰은 더 들더라도, 원하는 바를 더 정확히 전달해 재작업이 줄어든다면 오히려 전체 토큰은 덜 쓸 수도 있겠다는 생각이 들었습니다.

처음 바이브 코딩을 시작할 때 "이런 기능을 가진 앱을 만들어줘"라고 바로 말하기보다, 이 책을 옆에 두고 요구사항 정의의 처음 몇 항목이라도 확인한다면 결과는 훨씬 나아질 것 같습니다.

## 설계도 없이 집을 지을 수 있을까

6장에서는 요구사항이 명확해도 전체 구조가 정해지지 않으면 AI가 기능을 어디에 붙여야 할지 판단하기 어렵다고 설명합니다. 집을 지을 때 방 하나를 잘 만드는 것과 그 방이 집의 어디에 있어야 하는지를 정하는 일이 다른 것처럼, 코딩에도 전체 설계도가 필요합니다. 저는 그동안 기능 요청의 문제는 생각했지만 구조의 문제는 깊게 생각하지 못했습니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="바이브 엔지니어링 6장과 시스템 아키텍처 설계 독서 화면" tabindex="0">
    <img src="/images/posts/vibe-engineering-week2/chapter6-overview.webp" alt="시스템 아키텍처 설계를 다루는 바이브 엔지니어링 6장 목차" width="1200" height="1600" loading="lazy" style="width: min(82vw, 620px); height: min(120vw, 520px); max-height: 520px; object-fit: contain;" />
    <img src="/images/posts/vibe-engineering-week2/architecture-page.webp" alt="시스템 아키텍처 설계의 필요성을 설명하는 바이브 엔지니어링 본문" width="1200" height="1600" loading="lazy" style="width: min(82vw, 620px); height: min(120vw, 520px); max-height: 520px; object-fit: contain;" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 2</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

책은 전체 구조를 먼저 고정하는 HLD와 그 안에서 데이터베이스 스키마, API 명세, 처리 순서, 트랜잭션과 에러 처리 방식을 정하는 LLD를 나눠 설명합니다. AI에게 전달할 HLD와 LLD의 구조를 책에서 확인할 수 있었고, 어떻게 요청해야 할지 정리할 수 있었습니다.

하지만 비전공자로서 HLD와 LLD를 꼼꼼하게 작성해 요청하는 일은 여전히 어렵게 느껴졌습니다.

## 2주차를 마치며

이번 2주차를 읽고 나니 AI가 빠르게 만들어주는 코드 앞에서 나는 어떤 역할을 해야 하는지 계속 생각하게 됩니다. AI가 결과를 빠르게 내는 만큼 나도 빨리 승인하고 방향만 제시하는 것이 아니라, 오히려 더 천천히 꼼꼼하게 확인해야 하는 것은 아닐까 싶습니다.

책의 체크리스트와 프롬프트를 그대로 복사해 사용하는 데서 멈추기보다, 각각 어떤 맥락을 확인하기 위한 질문인지 이해하고 싶습니다. 문제가 생겼을 때 AI에게 답만 받기보다 코드와 환경, 로직, 전제조건과 한계를 함께 확인하면서 문제를 토론하듯 나아가는 방향으로 바꿔가고 싶습니다.

AI가 코드를 작성하는 속도를 모두 따라잡기는 어렵습니다. 그래서 내가 더 천천히 꼼꼼하게 확인해야 하는 것은 아닐까 하는 질문이 남았습니다.
