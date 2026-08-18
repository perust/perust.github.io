---
title: "[혼자 공부하는 바이브 코딩 with 클로드 코드] 6주차 후기: MCP와 데이터베이스, 어디까지 연결할까"
description: "AI 공감 다이어리 마음 구슬의 입력·감정·저장 흐름과 MCP로 Claude Code의 도구를 넓히는 과정을 살피며, 로컬 저장과 온라인 서비스의 경계를 고민한 6주차 기록입니다."
date: "2026-08-16"
category: "도서 학습 챌린지"
tags: ["바이브코딩", "ClaudeCode", "MCP", "AI코딩", "회고"]
editorialReview: true
valueType: "experience"
publishPacingException: "deadline-bound-challenge"
---

인프런과 한빛미디어에서 진행하는 「혼자 공부하는 바이브 코딩 with 클로드 코드」 챌린지 6주차입니다. 이번주차는 7-8장 커리큘럼이었으나, 저번주에 7장까지 진행해서 이번주에는 8장을 중심으로 진행했습니다. 6주차 실습으로 AI 공감 다이어리 「마음 구슬」도 만들어 봤습니다. 7장의 에이전트 실습은 [지난 5주차 후기](/blog/2026-08-11-vibe-coding-week5-api-ai-agents/)에 정리해 두었습니다.

이번 8장을 읽으면서 MCP와 데이터베이스에 대해 공부해보고, 데이터베이스와 온라인 연동에서 대해서 어디까지 연결을 해봐야할지도 생각해보게 되었습니다.

## 7장 PROJECT 10: AI 공감 다이어리, '마음 구슬'

6주차 프로젝트로 AI 공감 다이어리 「마음 구슬」을 만들었습니다. 간단한 하루 일기를 적으면 앱이 감정 구슬을 만들고, 감정과 세기를 측정해줄 수 있었습니다. 구슬안에는 이모티콘이나 원하는 글자를 적어서 해당 구슬에 대해서 간단하게 나마 표현할 수 있도록 구현했습니다. 저장된 기록은 날짜별로 정렬되며, 감정별로도 모아 볼 수 있었습니다.

만들어본 '마음 구슬' 서비스 화면을 간단하게 남겨보겠습니다.

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/05-mind-marble-entry.webp" alt="마음 구슬 앱의 입력 화면. '오늘 하루는 너무 재미있었다'라는 문장을 입력하고, 감정 구슬 생성 진행 중인 화면." width="1200" height="1102" loading="lazy" decoding="async" />
  </div>
  <figcaption>한 줄로 하루를 적은 뒤 감정 구슬을 만드는 중인 입력 화면.</figcaption>
</figure>

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/06-mind-marble-result.webp" alt="마음 구슬 앱 결과 화면. 기쁨 이모티콘 선택, 감정 세기 9/10, 공감 문장이 표시된다." width="1200" height="954" loading="lazy" decoding="async" />
  </div>
  <figcaption>이모티콘 선택 뒤 기쁨이라는 감정과 감정 세기 9/10이 표시되어 있는 결과 화면. 현재는 글자나 이모티콘을 직접 타이핑하도록 바꾸었다.</figcaption>
</figure>

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/07-mind-marble-memory-store.webp" alt="마음 구슬 앱의 기억 저장소 화면. 감정 필터와 8월 18일에 저장된 세 개의 감정 구슬 카드가 보인다." width="1200" height="424" loading="lazy" decoding="async" />
  </div>
  <figcaption>날짜와 감정 기준으로 저장된 기록을 모아 보는 기억 저장소 화면. 타이핑한 내용이 구슬 안에 보인다.</figcaption>
</figure>

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/01-chapter-08-overview.webp" alt="노트북 옆에 펼쳐 둔 책의 Chapter 08 시작면. MCP로 클로드 코드의 한계 넘어서기라는 제목과 학습 목표가 보인다." width="1200" height="1600" loading="lazy" decoding="async" />
  </div>
  <figcaption>8장은 MCP로 Claude Code의 도구 범위를 넓히는 흐름으로 시작한다.</figcaption>
</figure>

## MCP가 어디와 연결되는지

08-1은 MCP가 무엇인지, 로컬 MCP와 원격 MCP가 어떻게 다른지, Claude Code와 어떻게 연결하는지 다룹니다.

저는 Claude Code에 자연어로 부탁해 MCP를 붙이는 과정까지 도움을 받을 수 있었습니다. 확실히 편했으나, 편한 만큼 내가 모르고 지나가는 구간도 더 많이질 수 있습니다.

읽으면서 설치를 맡기는 일과 그 MCP에 대해새 이해하는 것은 다르다고 느꼈습니다. 어떤 MCP들이 있는지, 그게 어떤 외부 서비스와 연결되는지, 인증이나 API 키가 필요한지는 결국 내가 알고 판단해야 하는 부분입니다. AI에게 간단히 설치를 맡길 수 있어도 결과까지 대신 책임져 주지는 않습니다.

외부 서비스에 연결하는 MCP라면 어떤 권한을 요구하는지는 사람이 보고 정해야 한다고 느꼈습니다. 설치가 매끄럽게 끝날수록 이 부분을 건너뛰기 쉬워진다는 점도 신경 쓰였습니다.

그래서 MCP를 늘릴 때는 있으면 좋아 보인다고 하나씩 추가하기보다, 이게 내 어떤 반복 작업을 대신하는지, 그에 따라 어떤 권한과 관리 부담이 생기는지를 먼저 따져봐야겠다고 생각했습니다. 키나 토큰을 코드에 그대로 두지 않고 `.env` 같은 별도 환경설정 파일로 분리하는 습관이 중요하다는 것도 다시 확인했습니다.

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/02-mcp-connection.webp" alt="08-1 MCP 이해하고 클로드 코드와 연결하기 페이지. MCP, 클라이언트 서버 모델, 로컬 MCP, 원격 MCP, 인증 핵심 키워드가 보인다." width="1200" height="1600" loading="lazy" decoding="async" />
  </div>
  <figcaption>08-1에서는 MCP의 개념과 Claude Code 연결 방식을 다룬다.</figcaption>
</figure>

## 자동화에도 사람이 정할 일

08-2는 Context7으로 최신 문서를 참고하고 Playwright로 브라우저 테스트를 하며 GitHub로 버전 관리를 연결하는 내용입니다. 챕터 제목에는 '완전 자동화'가 붙어 있습니다.

읽고 나서 오래 남은 것은 자동화가 처리하는 단계보다 내가 정해야 하는 기준이었습니다. 테스트가 돌아갔다고 해서 모든 것이 끝난 것은 아니었습니다. 화면이 뜨고 클릭이 되는지부터 어떤 상태까지 확인해야 하는지, 통과 기준은 결국 사람이 정해야 합니다.

버전 관리도 비슷하게 느껴졌습니다. 커밋과 푸시를 대신 해줄 수 있게 되면 기록은 빠르게 쌓이는데, 그 기록은 나중에 무언가를 되돌릴 때 근거가 됩니다. 자동으로 쌓인다고 해서 아무 내용이나 남겨도 되는 건 아니겠구나 싶었습니다. 최신 문서를 참고한다고 해도 가져온 내용이 지금 내가 쓰는 버전과 맞는지는 한 번 더 봐야겠다고 느꼈습니다.

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/03-automation-workflow.webp" alt="08-2 MCP로 구현하는 완전 자동화 개발 환경 페이지. 테스트, 버전 관리, Context7, Playwright, 원격 저장소, 추가, 커밋, 푸시 키워드가 보인다." width="1200" height="1600" loading="lazy" decoding="async" />
  </div>
  <figcaption>08-2는 테스트와 버전 관리를 자동화 흐름으로 묶는다.</figcaption>
</figure>

## 설정이 편해져도 남는 확인

전에 Supabase를 설정할 때는 화면을 직접 보면서 생소한 항목을 하나씩 물어봤습니다. Claude가 알고 있는 내용과 제 눈앞의 화면이 달라 헷갈린 적도 있었습니다.

브라우저 화면을 보면서 지금 보이는 것을 기준으로 안내받는 방식은 그때를 떠올리면 편합니다. 다만 편해진 만큼 시키는 대로 누르기만 하게 되기 쉽습니다.

보안이나 민감한 데이터, 서버 설정은 마지막에 사람이 확인해야 한다고 생각합니다. 안내를 받더라도 이 설정이 실제로 어떤 결과를 만드는지 이해한 다음에 처리해야 합니다. 비개발자로 바이브코딩을 시작한 사람에게는 편의성만큼 안전하게 확인하는 절차가 필요하다고 느꼈습니다.

## 붙일 수 있으니까 붙였던 데이터베이스

08-3은 Vercel로 배포하고 Supabase로 데이터베이스를 연동해, 로컬에서 돌던 앱을 온라인 서비스로 넓히는 내용입니다. 이번 장에서 제일 오래 멈춰 있었던 부분입니다.

바이브코딩을 하면서 로그인이나 동기화, DB 연동이 예전보다 훨씬 쉬워졌습니다. 그러다 보니 작은 결과물에도 습관처럼 데이터베이스를 붙이게 됐습니다. 붙일 수 있으니까 붙였던 것에 가깝습니다.

그런데 계속 관리할 자신이 없거나, 경쟁력이 있는지 스스로도 불분명한 서비스에 데이터베이스를 붙여두면 나중에 마음대로 정리하기가 어려워집니다. 사용자가 아주 적더라도 실제로 누군가 데이터를 넣어둔 순간부터는 그냥 내려버릴 수 없습니다.

사용자가 자기 데이터를 맡긴다면 운영하는 쪽에는 최소한의 유지와 공지, 보호 책임이 생긴다고 봅니다. 로그인과 데이터베이스는 기능 체크리스트에서 하나 더 체크하는 항목이 아니라, 내가 얼마 동안 이걸 책임질 수 있는지에 대한 답에 가깝습니다.

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/04-service-database.webp" alt="08-3 데이터베이스 연결해 진짜 서비스 만들기 페이지. Vercel, 배포, 로컬 스토리지, 클라우드 스토리지, Supabase, 데이터베이스, 테이블 키워드가 보인다." width="1200" height="1600" loading="lazy" decoding="async" />
  </div>
  <figcaption>08-3의 배포·저장소 주제는 서비스의 책임 범위를 생각하게 했다.</figcaption>
</figure>

## 아직 결론을 못 낸 채로

지금은 로컬 스토리지와 내보내기 기능 정도로 시작해 보려고 합니다. 서비스가 어느 정도 형태를 갖추고 실제로 필요하다는 게 확인되고 제가 운영할 수 있겠다는 판단이 서면, 그때 로그인과 데이터베이스를 붙이는 쪽으로요.

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/08-shopping-list-local.webp" alt="짙은 배경의 쇼핑 리스트 화면. 로컬 저장중 표시, 태그 입력, 다이소·이마트·CU·GS 필터와 네 개의 항목이 보인다." width="1200" height="1052" loading="lazy" decoding="async" />
  </div>
  <figcaption>로컬 저장 상태와 태그별 목록을 보여 주는 쇼핑 리스트 화면.</figcaption>
</figure>

다만 이 결론이 깔끔하지 않은 건, 이용자 입장에서 로그인과 동기화가 너무 당연하기 때문입니다. 기기를 바꿔도 내 데이터가 따라오는 건 기본에 가깝고, 내보내기 기능만으로 다른 기기 연동을 맡기는 방식이 이용자에게 충분한지도 자신이 없습니다. 만드는 쪽에서 신중한 것과 쓰는 쪽에서 기대하는 것이 어디서 만나야 하는지는 아직 모르겠습니다.

<figure class="post-media-figure">
  <div class="image-carousel-track">
    <img src="/images/posts/2026-08-18-vibe-coding-week6-mcp-database/09-quiz-by-quiz-lobby.webp" alt="quiz by quiz 시작 화면. 퀴즈왕 프로필 카드, 캐릭터·랭킹·온라인 카드와 한국사·과학 등 카테고리가 보인다." width="1200" height="674" loading="lazy" decoding="async" />
  </div>
  <figcaption>카테고리와 온라인 메뉴가 보이는 quiz by quiz 시작 화면.</figcaption>
</figure>

8장을 읽고 나서도 답을 얻지는 못했습니다. 다만 질문은 조금 더 구체적으로 남았습니다. 무엇을 연결할 수 있는지보다, 연결한 뒤에 제가 계속 책임질 수 있는지를 묻게 됐습니다. 당분간은 이 질문을 계속 가지고 가려고 합니다.
