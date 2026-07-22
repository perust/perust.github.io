---
title: "Seedance로 AI 영상 만드는 방법과 요금 정리"
description: "BytePlus Seedance 2.0 기준으로 영상 생성 방법, API 사용 흐름, 모델 선택, 프롬프트 요령, 토큰·리소스팩 요금 구조를 정리했다."
date: "2026-07-03T17:18:57+09:00"
category: "AI/IT 정보"
tags: ["Seedance", "AI Video", "BytePlus", "ModelArk", "Video Generation"]
---

Seedance는 ByteDance 계열의 AI 영상 생성 모델이다.<br />
지금 새로 시작한다면 핵심은 구버전 Seedance 1.0보다 BytePlus ModelArk에서 제공하는 Dreamina Seedance 2.0 계열을 먼저 이해하는 것이다.<br />
공식 문서 기준 Seedance 2.0은 텍스트, 이미지, 영상, 오디오를 함께 입력으로 받아 새 영상을 만들고, 기존 영상을 편집하거나 이어 붙이고, Seedance 2.0 모델에서는 4K 출력까지 지원한다.

다만 비용 구조는 단순한 월 구독제가 아니다.<br />
BytePlus 공식 경로는 API 키, 모델 활성화, 리소스팩 또는 종량제 과금, 토큰 사용량 계산을 함께 봐야 한다.<br />
웹에서 “무료 AI 영상 생성기”처럼 보이는 서비스도 많지만, 실제로 제품이나 자동화에 붙이려면 공식 API 기준으로 사용법과 요금을 이해하는 편이 안전하다.

## 먼저 보는 결론

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">추천 시작점</span>
    <h3>Seedance 2.0 Fast 또는 Mini로 테스트</h3>
    <p class="issue-summary">최고 품질이 필요하면 Seedance 2.0, 속도와 비용 균형은 Fast, 비용 효율은 Mini 쪽이 맞다.</p>
    <p class="issue-meta">출처: BytePlus Dreamina Seedance 2.0 series tutorial</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">사용 흐름</span>
    <h3>API 키 발급 후 비동기 작업 생성</h3>
    <p class="issue-summary">ModelArk API 키를 만들고, 영상 생성 작업을 생성한 뒤 상태를 폴링해서 결과 영상 URL을 받는 방식이다.</p>
    <p class="issue-meta">base URL: https://ark.ap-southeast.bytepluses.com/api/v3</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">요금 구조</span>
    <h3>토큰 단가 × 영상 토큰 사용량</h3>
    <p class="issue-summary">공식 가격은 영상 길이, 해상도, 프레임레이트, 입력 영상 포함 여부에 따라 달라진다. 리소스팩을 쓰면 먼저 차감되고, 부족하면 종량제로 넘어갈 수 있다.</p>
    <p class="issue-meta">출처: BytePlus Pricing / Resource packs</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">주의점</span>
    <h3>실사 인물·저작권·환불 불가</h3>
    <p class="issue-summary">실제 사람 얼굴이 들어간 입력은 자산 등록·검증 정책을 확인해야 하고, Seedance 2.0 리소스팩은 공식 문서상 환불이 지원되지 않는다.</p>
    <p class="issue-meta">테스트 전에 작은 범위로 비용 확인 필요</p>
  </li>
</ul>

## Seedance 2.0 계열 차이

공식 문서에서 현재 Seedance 2.0 계열은 세 가지로 설명된다.

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">품질 우선</span>
    <h3>Dreamina Seedance 2.0</h3>
    <p class="issue-summary">가장 높은 생성 품질이 필요할 때 쓰는 기본 상위 모델이다. Seedance 2.0은 4K 영상 출력과 10-bit 인코딩을 지원한다고 안내된다.</p>
    <p class="issue-meta">모델 ID 예: dreamina-seedance-2-0-260128</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">균형형</span>
    <h3>Dreamina Seedance 2.0 Fast</h3>
    <p class="issue-summary">최상위 품질까지는 필요 없고 비용과 생성 속도의 균형이 중요할 때 선택하는 모델이다.</p>
    <p class="issue-meta">초안·반복 테스트에 현실적인 선택지</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">비용형</span>
    <h3>Dreamina Seedance 2.0 Mini</h3>
    <p class="issue-summary">공식 설명상 비용 효율을 가장 중시하는 모델이다. 아이디어 검증, 짧은 샘플, 대량 테스트에 먼저 붙여볼 만하다.</p>
    <p class="issue-meta">품질보다 단가와 반복 횟수가 중요할 때</p>
  </li>
</ul>

개인 사용자는 처음부터 최고 모델로 긴 영상을 뽑기보다 Mini나 Fast로 프롬프트와 구도를 잡고, 마음에 드는 컷만 상위 모델로 다시 만드는 흐름이 비용 면에서 낫다.

## 만들 수 있는 영상 유형

Seedance 2.0 문서에서 강조하는 기능은 단순한 텍스트 투 비디오만이 아니다.

### 텍스트로 새 영상 생성

가장 기본적인 방식이다. 원하는 장면, 인물, 카메라 움직임, 분위기, 화면비, 길이를 프롬프트로 적고 영상을 생성한다.

예시는 이렇게 시작할 수 있다.

<div class="routine-kv">
  <div><dt>Shot 1</dt><dd>어두운 작업실 책상 위에 노트북과 커피가 놓여 있다. 카메라는 천천히 오른쪽으로 이동한다.</dd></div>
  <div><dt>Shot 2</dt><dd>화면 속에서 AI 영상 편집 타임라인이 열리고, 짧은 클립들이 자동으로 이어진다.</dd></div>
  <div><dt>Shot 3</dt><dd>마지막에는 완성된 세로형 쇼츠 영상이 스마트폰 화면에 재생된다.</dd></div>
  <div><dt>스타일</dt><dd>현실적인 다큐멘터리 톤, 과한 네온 효과는 피한다.</dd></div>
</div>

공식 프롬프트 가이드는 복잡한 영상일수록 “0초부터 3초까지”처럼 시간을 강하게 고정하기보다 Shot 1, Shot 2, Shot 3 순서로 장면을 나누는 방식을 권한다.<br />
모델이 정확한 초 단위 타이밍을 안정적으로 따르는 것은 어렵기 때문이다.

### 이미지 참고 영상 생성

이미지를 넣고 그 이미지의 인물, 제품, 스타일, 화면 구도를 참고해 새 영상을 만들 수 있다. 공식 문서 기준 이미지는 0–9장까지 조합할 수 있다.

프롬프트에서는 “Image 1의 제품 형태를 참고해”, “Image 2의 조명 스타일을 유지해”처럼 어떤 이미지에서 무엇을 참고할지 분명하게 써야 한다.<br />
특히 여러 피사체가 있는 이미지라면 “Image 1의 왼쪽 인물”, “Image 2의 빨간 패키지”처럼 대상을 좁혀야 한다.

### 영상 참고 생성과 편집

기존 영상을 넣고 그 영상의 움직임, 카메라 워크, 분위기, 효과를 참고하거나, 특정 요소를 바꾸는 편집 작업도 가능하다. 공식 문서 기준 영상 입력은 0–3개까지 안내된다.

여기서 중요한 차이가 있다.<br />
새 영상을 만들 때는 “Video 1의 카메라 움직임을 참고해”처럼 쓰고, 기존 영상을 편집할 때는 “Video 1을 엄격하게 편집하고…”처럼 써야 한다.<br />
공식 프롬프트 가이드는 편집·연장 작업에서 “reference Video 1”이라고 쓰면 참조 생성 작업으로 오해될 수 있다고 설명한다.

### 오디오 참고와 음성·음악 반영

Seedance 2.0은 오디오도 참고 입력으로 받을 수 있다.<br />
공식 문서 기준 오디오는 0–3개까지 가능하지만, “텍스트 + 오디오”만 넣거나 “오디오만” 넣는 조합은 지원하지 않는다고 안내된다.<br />
즉 이미지나 영상 등 다른 모달과 함께 쓰는 쪽으로 이해하는 편이 안전하다.

예를 들면 “Audio 1의 목소리 톤을 참고해 내레이션을 생성”하거나 “Audio 2의 배경음악 분위기에 맞춰 장면 전환”처럼 쓸 수 있다.

### 영상 연장과 이어붙이기

원본 영상을 앞이나 뒤로 확장하거나, 2–3개의 영상 사이 전환 구간을 만들어 더 자연스럽게 이어 붙일 수 있다. 짧은 광고, 제품 데모, 쇼츠 도입부와 엔딩을 보강할 때 유용하다.

다만 뒤로 연장할 때 생성 결과가 원본 영상 전체를 다시 포함하지 않고 꼬리 구간만 포함할 수 있다.<br />
공식 문서는 필요하면 프롬프트로 “Video 1의 내용을 포함한 뒤 이어서…”처럼 원본 포함 여부를 명확히 하라고 안내한다.

## 공식 API 사용 흐름

BytePlus ModelArk 기준으로는 다음 순서다.

<div class="routine-template">
<ol class="step-list">
  <li>BytePlus 계정 생성 및 로그인</li>
  <li>ModelArk 콘솔에서 API Key 생성</li>
  <li>Seedance 2.0 계열 모델 활성화</li>
  <li>필요하면 Seedance 2.0 리소스팩 구매</li>
  <li>SDK 또는 REST API로 영상 생성 작업 생성</li>
  <li>작업 상태를 폴링</li>
  <li>succeeded 상태가 되면 결과 영상 URL 다운로드</li>
</ol>
</div>

공식 튜토리얼은 Python 샘플을 중심으로 설명한다. API 키는 `ARK_API_KEY` 환경변수로 넣고, ModelArk SDK에서 `https://ark.ap-southeast.bytepluses.com/api/v3` 엔드포인트를 사용한다.

영상 생성은 일반 채팅 API처럼 즉시 긴 응답을 받는 구조가 아니다.<br />
생성 시간이 걸리기 때문에 작업을 만든 뒤 `running`, `succeeded` 같은 상태를 확인하고 결과 URL을 받는다.<br />
공식 문서도 영상 생성 시간은 모델, API 부하, 출력 사양에 따라 길어질 수 있으므로 폴링 방식으로 상태를 확인하라고 안내한다.

## 프롬프트 작성 요령

Seedance 프롬프트는 예쁜 문장보다 촬영 지시서에 가깝게 쓰는 편이 좋다. 공식 가이드는 모델을 “멀티모달 AI director”처럼 보고, 공간 정보와 시간 흐름을 분리해서 전달하라고 설명한다.

### 좋은 기본 구조

<div class="routine-kv">
  <div><dt>주체</dt><dd>누가 또는 무엇이 나오는지</dd></div>
  <div><dt>장소</dt><dd>어떤 공간과 배경인지</dd></div>
  <div><dt>행동</dt><dd>무엇을 하는지</dd></div>
  <div><dt>카메라</dt><dd>고정, 줌인, 패닝, 핸드헬드 등</dd></div>
  <div><dt>분위기</dt><dd>조명, 색감, 장르, 속도감</dd></div>
  <div><dt>제약</dt><dd>피할 것, 유지할 것, 바꾸지 말 것</dd></div>
</div>

짧은 테스트라면 다음처럼 충분하다.

<div class="routine-kv">
  <div><dt>Shot 1</dt><dd>작은 카페 창가에 앉은 사람이 노트북으로 AI 영상 프롬프트를 작성한다. 카메라는 어깨 뒤에서 천천히 들어간다.</dd></div>
  <div><dt>Shot 2</dt><dd>노트북 화면에 여러 장면 썸네일이 빠르게 생성된다. 화면은 현실적인 작업 장면처럼 보이고 과장된 SF 효과는 피한다.</dd></div>
  <div><dt>Shot 3</dt><dd>스마트폰 세로 화면에서 완성된 8초짜리 제품 소개 영상이 재생된다. 자연광, 차분한 색감, 실제 촬영 같은 느낌.</dd></div>
</div>

### 이미지나 영상 참조를 쓸 때

참조 파일을 넣었다면 프롬프트에서 번호로 불러야 한다.

<div class="routine-template">
<ul>
  <li>Image 1의 제품 형태와 색상을 유지한다.</li>
  <li>Video 1의 손 움직임과 카메라 흔들림을 참고한다.</li>
  <li>Audio 1의 차분한 남성 내레이션 톤을 참고한다.</li>
</ul>
</div>

Asset ID를 쓰더라도 프롬프트 안에서는 `Image 1`, `Video 1` 같은 방식으로 지칭해야 한다.<br />
공식 문서는 모델이 Asset ID 자체를 참조 내용과 직접 연결해 이해하지 못하므로, 프롬프트에서는 입력 순서 기반 명칭을 쓰라고 안내한다.

### 피해야 할 방식

<div class="routine-kv">
  <div><dt>0–2초</dt><dd>사람이 걸어온다.</dd></div>
  <div><dt>2–3초</dt><dd>컵을 든다.</dd></div>
  <div><dt>3–4초</dt><dd>카메라가 줌인한다.</dd></div>
</div>

이런 초 단위 통제는 잘 맞지 않을 수 있다. 장면 순서와 핵심 행동을 나눠 쓰되, 각 장면의 정확한 초 단위는 모델에 맡기는 쪽이 안정적이다.

## 요금 구조 이해

Seedance 비용은 “영상 1개에 얼마”라고만 보면 헷갈린다. 공식 가격 문서는 다음 공식을 제시한다.

<div class="routine-template">
<ul>
  <li>영상 가격 추정 = 토큰 단가 × 토큰 사용량</li>
  <li>토큰 사용량 = (입력 영상 길이 + 출력 영상 길이) × 출력 가로 × 출력 세로 × 프레임레이트 / 1024</li>
</ul>
</div>

여기서 입력 영상이 없는 텍스트·이미지 기반 생성과, 입력 영상이 있는 편집·연장 작업의 단가가 다를 수 있다.<br />
Seedance 2.0과 Seedance 2.0 Fast는 입력 영상이 있을 때 최소 토큰 사용량 제한도 있다.<br />
실제 과금은 API 응답의 `usage.completion_tokens` 값을 기준으로 봐야 한다.

공식 Pricing 문서에 표시된 Seedance 2.0 계열 단가 핵심은 다음과 같다.

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">Seedance 2.0</span>
    <h3>해상도와 입력 영상 여부에 따라 변동</h3>
    <p class="issue-summary">480p·720p 출력은 입력 영상 없음 0.0070달러/K tokens, 입력 영상 있음 0.0043달러/K tokens로 안내된다.<br />
1080p는 0.0077·0.0047, 4K는 0.0040·0.0024달러/K tokens로 표시된다.</p>
    <p class="issue-meta">모델 ID 예: dreamina-seedance-2-0-260128</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">Seedance 2.0 Fast</span>
    <h3>품질과 비용의 중간 선택지</h3>
    <p class="issue-summary">공식 리소스팩 문서에는 Fast 계열의 480p·720p 입력 영상 포함 단가가 0.0033달러/K tokens, 입력 영상 미포함 단가가 0.0056달러/K tokens로 제시된다.</p>
    <p class="issue-meta">반복 테스트와 상용 워크플로의 중간 지점</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">Seedance 2.0 Mini</span>
    <h3>가장 낮은 단가 지향</h3>
    <p class="issue-summary">공식 리소스팩 문서에는 Mini 계열 단가가 0.0021달러/K tokens로 표시된다. 품질보다 반복 횟수와 비용 관리가 중요할 때 먼저 볼 만하다.</p>
    <p class="issue-meta">간단한 샘플·대량 초안에 적합</p>
  </li>
</ul>

리소스팩도 별도로 있다.<br />
공식 문서 기준 Seedance 2.0 리소스팩은 온라인 추론 토큰 소비를 먼저 차감하는 선불 자원이다.<br />
유효기간은 구매 후 90일이고, 환불은 지원되지 않는다고 안내된다.<br />
또한 리소스팩이 만료되거나 모두 차감되면 초과 사용량은 자동으로 종량제 과금으로 전환될 수 있다.

확인된 리소스팩 예시는 다음과 같다.

<div class="routine-grid">
  <section class="routine-card">
    <h3>Dreamina Seedance 2.0</h3>
    <p>1M tokens 4.3달러, 10M tokens 43달러, 100M tokens 430달러로 안내된다.</p>
    <p>1M tokens는 최소 7개 구매 안내가 붙어 있다.</p>
  </section>
  <section class="routine-card">
    <h3>Dreamina Seedance 2.0 Fast</h3>
    <p>1M tokens 3.3달러, 10M tokens 33달러, 100M tokens 330달러로 안내된다.</p>
    <p>1M tokens는 최소 9개 구매 안내가 붙어 있다.</p>
  </section>
  <section class="routine-card">
    <h3>Dreamina Seedance 2.0 Mini</h3>
    <p>10M tokens 21달러, 100M tokens 210달러로 안내된다.</p>
    <p>10M tokens는 최소 2개 구매 안내가 붙어 있다.</p>
  </section>
</div>

단, 리소스팩 문서는 페이지 표시 가격은 참고용이며 최종 결제 가격을 기준으로 보라고 적고 있다. 실사용 전에는 반드시 콘솔의 최신 가격, 지역, 세금, 계정 상태를 다시 확인해야 한다.

## 대략적인 비용 감각

정확한 비용은 공식 Price Calculator와 API 응답의 `usage.completion_tokens`로 확인하는 것이 맞다. 그래도 감을 잡기 위해 계산 구조만 보면 이렇다.

<div class="routine-template">
<ol class="step-list">
  <li>짧은 480p 5초 테스트</li>
  <li><span class="step-arrow">→</span> 출력 픽셀과 프레임 수가 작아 비용 확인용으로 적합</li>
  <li>720p 10초 영상</li>
  <li><span class="step-arrow">→</span> 쇼츠나 제품 데모 초안에 현실적인 테스트 범위</li>
  <li>1080p 또는 4K</li>
  <li><span class="step-arrow">→</span> 최종 후보 컷에만 사용 권장</li>
</ol>
</div>

영상 AI는 재시도가 비용의 핵심이다.<br />
한 번에 좋은 결과가 나오는 경우보다, 프롬프트를 바꾸고 참조 이미지를 바꾸고 모델을 바꾸며 여러 번 다시 뽑는 경우가 많다.<br />
그래서 비용 관리는 “한 편의 최종 영상 가격”보다 “최종 영상 하나를 얻기까지 몇 번 실패할 것인가”로 봐야 한다.

## fal.ai와 Replicate 같은 우회 경로

공식 BytePlus API가 부담스럽다면 fal.ai나 Replicate 같은 모델 호스팅 서비스에서 Seedance 1.0 계열을 바로 호출하는 방법도 있다.<br />
예를 들어 fal.ai의 Seedance 1.0 Pro Text to Video 페이지는 `fal-ai/bytedance/seedance/v1/pro/text-to-video` 엔드포인트를 1M tokens당 2.5달러로 표시한다.<br />
Replicate의 ByteDance Seedance 1 Pro 페이지는 480p 기준 출력 영상 초당 0.03달러, 약 33초에 1달러라고 안내한다.

다만 이 경로는 Seedance 2.0 공식 API와 모델, 기능, 가격 단위가 다르다.<br />
빠른 실험에는 편하지만, 4K 출력, 멀티모달 편집, 리소스팩, 기업 계정 운영까지 생각하면 BytePlus 공식 문서를 기준으로 다시 설계해야 한다.

## 실제로 시작하는 추천 순서

처음부터 자동화 앱에 붙이기보다 다음 순서가 낫다.

<div class="routine-template">
<ol class="step-list">
  <li>480p 또는 720p, 5–8초 영상으로 시작</li>
  <li>Seedance 2.0 Mini 또는 Fast로 프롬프트 테스트</li>
  <li>마음에 드는 장면 구조를 Shot 단위로 정리</li>
  <li>이미지·영상 참조가 필요한지 판단</li>
  <li>최종 후보만 Seedance 2.0과 고해상도로 재생성</li>
  <li>API 응답의 usage.completion_tokens 기록</li>
  <li>평균 실패 횟수까지 포함해 실제 제작 단가 계산</li>
</ol>
</div>

블로그 쇼츠, 제품 소개, 앱 데모, 광고 초안처럼 반복 제작이 필요한 경우에는 결과 파일 URL을 바로 쓰지 말고 따로 저장하는 흐름도 필요하다.<br />
공식 튜토리얼은 생성 결과 URL이 24시간만 유효한 예시를 언급하며, 실제 사용에서는 BytePlus TOS 같은 저장소로 옮겨 장기 보관하는 방식을 권한다.

## 체크리스트

Seedance를 제품이나 자동화에 붙이기 전에는 아래를 확인하는 편이 좋다.

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">계정</span>
    <h3>API 키와 모델 활성화</h3>
    <p class="issue-summary">ModelArk API 키를 만들고, 사용할 Seedance 2.0 계열 모델이 계정에서 활성화됐는지 확인한다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">비용</span>
    <h3>리소스팩과 종량제 전환</h3>
    <p class="issue-summary">리소스팩은 90일 유효, 환불 불가, 소진 후 종량제 전환 가능성이 있다. 테스트 예산을 먼저 정해야 한다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">품질</span>
    <h3>Mini·Fast·2.0 역할 분리</h3>
    <p class="issue-summary">초안은 Mini나 Fast, 최종 후보는 Seedance 2.0처럼 모델 역할을 나누면 실패 비용을 줄일 수 있다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">운영</span>
    <h3>결과 URL 장기 저장</h3>
    <p class="issue-summary">생성 결과 URL은 영구 보관용으로 가정하지 말고, 필요한 파일은 별도 스토리지로 옮기는 구조를 만든다.</p>
  </li>
</ul>

## 참고한 공식 문서

- [BytePlus Seedance 제품 페이지](https://www.byteplus.com/en/product/seedance)
- [Dreamina Seedance 2.0 series tutorial](https://docs.byteplus.com/en/docs/ModelArk/2291680)
- [Dreamina Seedance 2.0 series prompt guide](https://docs.byteplus.com/en/docs/ModelArk/2222480)
- [BytePlus ModelArk Pricing](https://docs.byteplus.com/en/docs/ModelArk/1544106)
- [Resource packs for Dreamina Seedance 2.0 series models](https://docs.byteplus.com/en/docs/ModelArk/2191775)
- [Video generation tutorial](https://docs.byteplus.com/en/docs/ModelArk/2298881)
- [fal.ai Seedance 1.0 Pro Text to Video](https://fal.ai/models/fal-ai/bytedance/seedance/v1/pro/text-to-video)
- [Replicate ByteDance Seedance 1 Pro](https://replicate.com/bytedance/seedance-1-pro)
