---
title: "[혼자 공부하는 바이브 코딩 with 클로드 코드] 5주차 후기: API와 AI 에이전트 개발팀"
description: "혼자 공부하는 바이브 코딩 with 클로드 코드 5주차 기록입니다. 무료 AI API의 한도와 품질 문제, 기존 앱을 개선하며 경험한 서브 에이전트 협업을 정리했습니다."
date: "2026-08-11"
category: "도서 학습 챌린지"
tags: ["바이브코딩", "ClaudeCode", "AI에이전트", "AI모델", "회고"]
editorialReview: true
valueType: "experience"
publishPacingException: "deadline-bound-challenge"
---

인프런 [6주 과정] 『혼자 공부하는 바이브 코딩 with 클로드 코드』 완독 챌린지 2기 5주차 후기입니다.

이번 주에는 Ch 06에서 외부 AI API를 연결하고, Ch 07에서 역할이 다른 서브 에이전트들을 개발팀처럼 협업시키는 방법을 실습했습니다. API를 붙이면 앱이 금방 똑똑해질 것 같았지만, 직접 테스트해보니 모델 선택보다 먼저 한도와 비용, 응답 실패를 고민하게 되었습니다. 에이전트 팀은 반대로 책이 나온 뒤에도 활용 가치가 더 커지고 있다고 느꼈습니다.

[4주차](/blog/2026-08-04-vibe-coding-week4-todo-quiz/)에는 할 일 앱과 퀴즈 앱을 새로 만들었습니다. 이번에는 냉장고 앱과 일기 앱까지 다시 처음부터 만들면 토큰을 지나치게 많이 쓸 것 같아, 기존 작업물을 이어서 개선하는 쪽을 택했습니다. 냉장고 앱은 기존의 재료 인식과 레시피 생성 흐름을 유지하고, 제공자 전환과 실패 표시, 역할별 검토를 더했습니다. 일기 앱은 감정 분석과 공감 메시지를 유지하면서 기억 저장소 화면을 더했습니다.

<ul class="issue-list">
  <li class="issue-card"><span class="issue-badge">Ch 06</span><h3>외부 AI API 연결</h3><p class="issue-summary">냉장고 사진을 분석하고 레시피를 만드는 앱에 OpenRouter와 NVIDIA API를 연결하며 무료 한도, 모델 실패, 키 보관 방법을 확인했습니다.</p></li>
  <li class="issue-card"><span class="issue-badge">Ch 07</span><h3>AI 개발팀 구성</h3><p class="issue-summary">코드 리뷰, 성능, UX, 백엔드, 프런트엔드, QA 역할을 나누고 공감 다이어리와 PDF 요약 앱에서 협업 결과를 확인했습니다.</p></li>
</ul>

## Ch 06. 클로드 코드에 API 날개 달기

API는 프로그램과 프로그램이 요청과 응답을 주고받는 규칙입니다. OpenRouter를 사용하면 하나의 API 형식으로 여러 회사의 AI 모델을 비교하고 호출할 수 있습니다. 이번 실습에서는 냉장고 사진을 읽는 비전 모델과, 인식한 재료로 레시피를 작성하는 텍스트 모델을 따로 연결했습니다.

API 키는 코드에 직접 넣지 않고 `.env`에 보관했으며, 이 파일은 `.gitignore`로 Git 추적에서 제외했습니다. 브라우저가 모델 제공자를 직접 호출하게 하지 않고 서버에서만 키를 읽는 구조도 중요했습니다. 실제 키 값은 글과 화면에 남기지 않았습니다.

## `/init`은 프로젝트의 맥락이 생긴 뒤에

책에서는 새 폴더를 만든 직후 `/init`을 실행하지만, 지금의 클로드 코드는 폴더에 있는 파일을 분석해 `CLAUDE.md` 초안을 만듭니다. 아무것도 없는 폴더에서 먼저 실행하면 참고할 맥락도 적습니다.

직접 사용해보니 PRD와 기본 파일이 생긴 뒤 `/init`을 실행하는 편이 프로젝트의 명령어와 규칙을 더 구체적으로 담기 좋았습니다. 처음부터 실행하면 안 된다는 뜻은 아니고, `/init`이 단순 초기화 명령이 아니라 현재 코드베이스를 읽고 규칙 문서를 만드는 과정이라는 점을 새로 이해했습니다.

<small>참고: [Claude Code 공식 문서의 `CLAUDE.md`와 `/init` 설명](https://code.claude.com/docs/en/memory#claude-md-files)</small>

## 몇 달 사이에도 바뀌는 모델 생태계

OpenRouter의 모델 사용량 화면을 예전에 저장한 화면과 비교해봤습니다. 2월에는 일부 모델에 사용량이 집중되어 있었지만, 8월 화면에서는 `Others`의 비중과 다양한 모델의 사용량이 크게 늘어 있었습니다. 특정 모델의 순위를 고정된 추천처럼 받아들이기 어렵고, 실습하는 시점마다 다시 확인해야 한다는 생각이 들었습니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track image-carousel-track--contained-slides" role="region" aria-label="OpenRouter 모델 사용량 변화" tabindex="0">
    <img src="/images/posts/2026-08-11-vibe-coding-week5/01-openrouter-feb.webp" alt="2026년 2월 2일에 확인한 OpenRouter 모델 사용량 순위" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/02-openrouter-aug.webp" alt="2026년 8월 3일에 확인한 OpenRouter 모델 사용량 순위" loading="lazy" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 2</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

## 테스트하다가 무료 한도를 다 써버리다

OpenRouter의 무료 모델을 연결하고 여러 번 테스트하다가 하루 한도를 모두 소모했습니다. 체감상 몇십 번 정도였는데, 오류를 확인하고 다시 호출하는 과정까지 겹치니 생각보다 훨씬 빨리 끝났습니다.

글을 정리하며 [OpenRouter 공식 한도 문서](https://openrouter.ai/docs/api-reference/limits)를 다시 확인했습니다. 글 작성 시점 기준으로 누적 구매액이 10달러 미만인 계정에서 `:free` 무료 모델은 하루 50회, 분당 20회로 안내되어 있었습니다. 계정 단위 한도라 무료 모델만 바꾸어도 해결되지 않았습니다.

충전하면 일일 한도가 늘어나지만, 무료 API를 사용해보는 이번 학습의 취지와는 조금 다르게 느껴졌습니다. Gemini API를 추가할지도 고민했지만, 우선 NVIDIA에서도 모델 API를 제공한다는 것을 알고 제공자를 하나 더 연결했습니다. 제가 사용한 NVIDIA 엔드포인트는 일일 한도보다 분당 제한을 중심으로 동작해 개발 중 반복 테스트가 더 원활했습니다.

## 무료라는 조건과 결과의 품질 사이

한도만 문제가 아니었습니다. 무료 모델은 이미지 속 재료를 놓치거나 요청이 실패하는 일이 있었고, 레시피 결과의 품질도 일정하지 않았습니다. 무료 API만으로 여러 사람이 쓰는 서비스를 운영하기는 쉽지 않겠다는 생각이 들었습니다. 반대로 사용량에 따라 과금되는 모델을 연결하면 테스트와 운영 비용을 미리 가늠하기 어렵습니다.

지난주 할 일 앱과 퀴즈 앱을 계속 고도화하면서 클로드 코드 토큰도 빠르게 소모했습니다. 아직 넣지 못한 온라인 기능도 있는데, 실습 앱마다 끝까지 확장하려다 보면 비용과 시간이 모두 커질 수 있었습니다. 이번 냉장고 앱은 제가 오래 다루고 싶은 분야는 아니어서, 무리하게 기능을 늘리기보다 API 연동과 실패 처리까지 확인하는 데 집중했습니다.

장기적으로는 개인 PC에서 로컬 모델을 실행하고 앱이 이를 호출하는 방식도 떠올랐습니다. 사용량 비용을 직접 통제할 수 있다는 장점이 있지만, 하드웨어와 운영 부담이 생기므로 모든 경우의 정답이라고 보기는 어렵습니다. 결국 목적과 사용자 수에 맞게 무료 API, 유료 API, 로컬 모델을 선택해야 할 것 같습니다.

## 냉장고 사진에서 레시피까지

냉장고 앱은 한 번에 완성하지 않고 세 단계의 PRD로 나눴습니다.

1. 냉장고 사진에서 식재료 인식
2. 사용자가 확인한 재료로 레시피 생성
3. 사용자 프로필과 레시피 저장

사진을 올리면 비전 모델이 재료 목록을 만들고, 사용자가 잘못 인식했거나 빠진 재료를 수정합니다. 그다음 알레르기나 제외 조건을 반영해 만들 수 있는 요리를 추천하고, 선택한 요리의 재료와 조리법을 보여줍니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="냉장고 재료 인식과 레시피 생성 과정" tabindex="0">
    <img src="/images/posts/2026-08-11-vibe-coding-week5/03-fridge-upload.webp" alt="냉장고 사진을 올려 재료 분석을 시작하는 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/04-fridge-detected.webp" alt="AI가 냉장고 사진에서 인식한 식재료 목록" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/05-fridge-ingredients.webp" alt="인식된 재료의 이름과 수량을 수정하고 조건을 설정하는 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/06-fridge-generating.webp" alt="보유 재료를 바탕으로 AI 레시피를 생성하는 대기 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/07-fridge-recipes.webp" alt="냉장고 재료로 만들 수 있는 추천 요리 목록" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/08-fridge-detail.webp" alt="선택한 추천 요리의 재료와 단계별 조리법" loading="lazy" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 6</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

`CLAUDE.md`에는 어떤 모델이 실제로 실행되었는지 확인하고, API가 실패하면 성공한 것처럼 결과를 꾸미지 않도록 규칙을 남겼습니다. 이미지 분석이 실패했을 때 브라우저에도 실패 사실을 그대로 보여주게 했습니다. 무료 모델은 요청 제한이나 일시적인 오류가 자주 생길 수 있어서, 정상 결과보다 실패 경로를 확인하는 일이 더 중요했습니다.

공개 저장소에는 실제 키가 아닌 `.env.example`만 두고, `.env`와 로컬 데이터베이스는 Git에서 제외했습니다. 로컬 실행형이라 바로 체험하는 링크는 아니지만, 단계별 PRD와 제공자 전환, 점검 코드는 아래에서 볼 수 있습니다.

<a href="https://github.com/perust/fridge-recipe-nim" class="app-launch-button" aria-label="GitHub에서 냉장고 재료 인식 레시피 추천 프로젝트 보기"><span class="app-launch-button__label">냉장고 레시피 프로젝트 보기</span><span class="app-launch-button__action">GitHub <span aria-hidden="true">→</span></span></a>

## Ch 07. AI 에이전트로 개발팀 구성하기

서브 에이전트는 코드 리뷰, 성능 점검, UX 검토처럼 특정 역할을 맡아 별도의 맥락에서 작업하는 AI 도우미입니다. 한 에이전트가 모든 일을 이어서 하는 대신 역할과 검토 순서를 나누면, 작업 기준을 반복해서 설명하는 부담을 줄일 수 있습니다.

책에서는 `/agents` 명령의 위저드로 에이전트를 만들었습니다. 현재 버전에서 실행해보니 위저드는 제거되었다는 안내가 나왔고, 원하는 역할을 자연어로 요청하거나 `.claude/agents/`에 마크다운 파일을 직접 만들도록 바뀌어 있었습니다.

[Claude Code 공식 서브 에이전트 문서](https://code.claude.com/docs/en/sub-agents)에도 v2.1.198부터 `/agents`가 대화형 생성 위저드를 열지 않으며, 클로드에게 생성을 요청하거나 해당 폴더를 직접 편집하라고 설명되어 있습니다. 서브 에이전트 자체가 없어진 것이 아니라 만드는 UI가 단순해진 변화였습니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="현재 클로드 코드에서 서브 에이전트를 만드는 과정" tabindex="0">
    <img src="/images/posts/2026-08-11-vibe-coding-week5/09-agents-wizard-change.webp" alt="에이전트 생성 위저드가 자연어 생성 방식으로 바뀌었다고 설명한 클로드 코드 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/10-agents-command-removed.webp" alt="agents 명령의 대화형 위저드가 제거되었다는 안내" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/11-list-agents-empty.webp" alt="등록된 사용자 서브 에이전트가 없다고 표시된 목록" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/12-create-code-reviewer.webp" alt="자연어로 코드 리뷰어 에이전트 생성을 요청한 화면" loading="lazy" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 4</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

## 같은 역할의 에이전트가 있으면 기존 설정부터 살펴봤다

코드 리뷰어, 성능 최적화, UX 디자이너 역할을 만들고 냉장고 앱을 차례로 검토하게 했습니다. 이미 같은 역할의 에이전트가 있을 때는 새 파일을 무조건 만들지 않고 기존 설정을 확인한 뒤 보완했습니다. 여러 역할을 추가하자 협업 규칙까지 함께 정리해 에이전트들이 순서대로 결과를 넘겨받도록 구성하는 모습도 확인했습니다.

예전에는 에이전트끼리 협업하라는 명령과 별도의 하네스를 더 세밀하게 작성해야 했다면, 지금은 역할을 분명하게 만들기만 해도 필요한 협업 구조를 먼저 제안했습니다. 모델이 발전할수록 잘 쓰는 사람이 하나하나 다듬던 설정을 기본적으로 챙기는 범위가 넓어지는 것 같았습니다.

그렇다고 누구나 같은 결과를 얻는 것은 아니었습니다. 어떤 역할이 필요한지, 결과를 어느 순서로 검증할지, 완료의 기준이 무엇인지 알고 있어야 요청도 구체적으로 할 수 있습니다. 지금도 "만들어줘" 한마디로 완벽한 프로그램이 나오지는 않았고, 중간 결과를 확인하고 다시 요구하는 과정이 필요했습니다.

## 공감 다이어리와 감정 구슬

AI 공감 다이어리는 하루를 한 줄로 적으면 감정을 분석하고 공감 메시지를 덧붙이는 앱입니다. 백엔드 담당은 API 연동과 저장, 프런트엔드 담당은 따뜻한 일기장 화면, QA 담당은 여러 입력과 오류 상황을 맡도록 했습니다.

책의 기본 아이디어에 기억 저장소처럼 감정을 구슬로 보여달라는 요구를 더했습니다. 글을 입력한 뒤 감정의 종류와 강도에 따라 색이 다른 구슬이 생기고, 기록은 시간순으로 쌓이게 했습니다. 예제를 그대로 하나 더 만드는 대신 제가 떠올린 화면을 역할별 에이전트가 나누어 구현하게 해본 부분입니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="AI 공감 다이어리의 작성과 감정 구슬 결과" tabindex="0">
    <img src="/images/posts/2026-08-11-vibe-coding-week5/18-diary-write.webp" alt="오늘 있었던 일을 한 줄로 적는 AI 공감 다이어리 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/17-diary-analysis.webp" alt="기쁨 감정 분석과 공감 메시지, 노란 감정 구슬이 생성된 결과" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/19-diary-memory-orbs.webp" alt="날짜와 감정별 구슬이 쌓인 AI 공감 다이어리 기억 저장소" loading="lazy" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 3</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

## PDF 요약 앱에서 드러난 완료 보고의 빈틈

PDF 요약 앱은 PM이 요구사항을 정리하고, 백엔드 담당이 파일 업로드와 텍스트 추출을 만들고, AI 통합 담당이 모델을 연결한 뒤 프런트엔드와 QA가 마무리하는 흐름으로 진행했습니다. 파일을 끌어다 놓고 간단, 보통, 상세 요약 중 하나를 고르면 결과를 보여주는 앱입니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="PDF 문서 업로드와 요약 모드 선택" tabindex="0">
    <img src="/images/posts/2026-08-11-vibe-coding-week5/13-pdf-upload.webp" alt="PDF 문서를 끌어다 놓거나 선택하는 업로드 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/14-pdf-summary-modes.webp" alt="간단 요약과 보통 요약, 상세 요약을 선택하는 버튼" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/15-pdf-detailed-summary.webp" alt="PDF 상세 요약 결과가 표시된 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/16-pdf-normal-summary.webp" alt="다시 실행한 PDF 보통 요약 결과" loading="lazy" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 4</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

에이전트들은 작업과 테스트가 끝났다고 보고했지만, 실제 PDF를 넣어보니 상세 요약이 문서의 뒷부분을 잘라낸 채 요약한 것처럼 보였습니다. 다시 요청하자 이번에는 상세 내용 없이 두 문단 정도로 끝났습니다. 상세 요약을 선택한 뒤 보통 요약으로 바꾸면서 이전 상태가 섞였는지도 분명하지 않았습니다.

<div class="image-carousel" data-image-carousel>
  <div class="image-carousel-track" role="region" aria-label="PDF 요약 처리와 최종 결과 상세 화면" tabindex="0">
    <img src="/images/posts/2026-08-11-vibe-coding-week5/20-pdf-processing.webp" alt="업로드한 PDF를 보통 요약 모드로 처리하는 화면" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/21-pdf-summary-result.webp" alt="한 줄 요약과 핵심 포인트, 상세 내용이 표시된 PDF 요약 결과" loading="lazy" />
    <img src="/images/posts/2026-08-11-vibe-coding-week5/22-pdf-summary-metadata.webp" alt="핵심 키워드와 문서 분량, 사용 모델, 처리 시간이 표시된 결과 하단" loading="lazy" />
  </div>
  <div class="image-carousel-controls">
    <button type="button" data-carousel-prev aria-label="이전 사진">← 이전</button>
    <span class="image-carousel-status" data-carousel-status role="status" aria-live="polite">사진 1 / 3</span>
    <button type="button" data-carousel-next aria-label="다음 사진">다음 →</button>
  </div>
</div>

이 경험 때문에 테스트 완료라는 보고만 믿을 수는 없었습니다. 파일이 업로드되고 응답이 나온다는 확인과, 문서 전체를 읽고 선택한 수준에 맞게 요약했다는 검증은 다른 문제였습니다. QA 에이전트가 있어도 실제 문서의 앞뒤 내용이 보존되는지, 모드를 바꿨을 때 상태가 초기화되는지처럼 사람이 정한 기준이 필요했습니다.

## 모델이 좋아질수록 공부가 덜 필요할까

이번 실습에서는 대화형 생성 위저드가 사라지고 자연어 요청으로 바뀐 모습, 기존 에이전트를 알아서 확인하고 협업 규칙까지 보완하는 모습을 보았습니다. 예전에는 설정을 잘 다루는 사람이 오랫동안 깎아야 했던 부분을 모델이 먼저 채워주는 방향으로 발전하고 있는 것 같습니다.

하지만 모델이 편리해질수록 결과를 구분하는 기준은 더 중요해지는 것 같습니다. 무료 API의 실패가 코드 문제인지 제공자 한도인지 구분해야 했고, PDF 요약 결과가 화면에 나왔다는 사실과 제대로 요약되었다는 사실도 구분해야 했습니다. 같은 모델을 사용해도 더 많이 찾아보고 이해한 사람이 더 구체적인 기준을 줄 수 있다는 점은 달라지지 않았습니다.

코딩을 많이 알지 못한 상태에서 공부에 끝이 없다고 말하기는 조금 조심스럽습니다. 지금으로서는 더 공부해야 한다는 쪽이 맞는 것 같습니다. 프롬프트를 잘 쓰는 것만이 아니라, 어떤 구조가 필요한지와 무엇을 테스트해야 하는지를 알아야 제가 원하는 방향으로 개발을 이어갈 수 있기 때문입니다.

## 5주차를 마치며

Ch 06에서는 AI 기능을 붙이는 일보다 한도와 비용, 실패를 다루는 일이 더 현실적인 문제라는 것을 배웠습니다. 무료 모델은 가볍게 시작하기 좋지만 반복 테스트만으로도 한도가 빠르게 소진되었고, 결과 품질도 일정하지 않았습니다. 이번에는 예제를 필요한 정도로 구현하고, 앞으로 어떤 제공자와 실행 방식을 선택할지 더 지켜보기로 했습니다.

Ch 07의 에이전트 팀은 지금도 계속 써보고 싶은 방법이었습니다. 역할을 나누는 것에서 끝나지 않고, 서로의 결과를 검토하고 다음 담당자에게 넘기는 구조를 더 유기적으로 만들고 싶어졌습니다. 언젠가는 여러 에이전트가 하나의 작은 회사처럼 개발하고 운영하도록 구성해보고 싶습니다.

바이브 코딩을 배우기 전에는 혼자서 이런 구조를 생각해볼 기회도 많지 않았습니다. 아직은 사람이 여러 번 방향을 잡고 검증해야 하지만, 이전에는 꿈꾸기 어려웠던 프로젝트를 실제 작업 단위로 나누어 시도해볼 수 있게 되었다는 점이 이번 주의 가장 큰 변화였습니다.
