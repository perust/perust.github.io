---
title: "[혼자 공부하는 바이브 코딩 with 클로드 코드] 3주차 후기: 손글씨 인식 프로그램"
description: "혼자 공부하는 바이브 코딩 with 클로드 코드 3주차 기록입니다. 두 번의 프롬프트로 MNIST 학습부터 macOS 실행 앱 제작까지 마친 과정과 이전 AI 버전과의 차이를 정리했습니다."
date: "2026-07-26"
category: "도서 학습 챌린지"
tags: ["바이브코딩", "ClaudeCode", "AI코딩", "개발도구", "회고"]
editorialReview: true
valueType: "experience"
---

이번 주에는 『혼자 공부하는 바이브 코딩 with 클로드 코드』 Ch 03을 공부하고, 손글씨 숫자를 인식하는 프로그램을 만들었습니다.
이 실습은 예전 버전의 AI로도 진행한 적이 있습니다. 그래서 같은 미션을 지금 버전으로 다시 해보면 어느 정도 달라졌는지 궁금했습니다. 결과부터 말하면 이번에는 프로그램 제작과 MNIST 학습, macOS 실행 앱 생성까지 두 번의 프롬프트로 완료할 수 있었습니다.

## 체감되는 AI 모델 성능

처음 입력한 프롬프트는 다음과 같습니다.

> 손글씨로 숫자를 입력하면 이것을 인식하는 코드를 만들어서 실행해 줘. 모든 코드와 주석을 영어로 작성해 줘.

![현재 버전 Claude Code에 손글씨 숫자 인식 프로그램 제작을 요청한 화면](/images/posts/2026-07-26-vibe-coding-week3/05-current-prompt.webp)

이후 실행 파일도 만들어 달라고 한 번 더 요청했습니다. 손글씨 인식 프로그램을 만들어 달라는 프롬프트와 실행 파일을 만들어 달라는 프롬프트, 이렇게 두 번의 프롬프트로 정상 작동하는 프로그램을 만들 수 있었습니다.

Claude Code는 코드를 바로 쓰지 않고 먼저 환경부터 확인했습니다. TensorFlow, PIL, tkinter를 쓸 수 있는지 살펴봤고, MNIST 다운로드도 점검했습니다. macOS Python의 SSL 인증서 문제를 발견하자 `certifi`로 해결을 시도했습니다.

예전에는 클로드가 혼자서 잘 진행하긴 하는데, 완성본을 보면 오류가 있었습니다. MNIST 학습도 프롬프트를 주고나서야 학습을 시작했었습니다. 지금은 필요한 준비와 문제를 먼저 찾고 다음 작업을 이어가면서, MNIST 다운로드 여부까지 자동으로 확인하는 모습을 보니 모델 성능이 올라간 것이 실감났습니다.

## 첫 프롬프트에서 MNIST 학습, 프로그램 완성

Claude Code는 화면 구성에 그치지 않고 실제 인식에 필요한 MNIST 학습까지 진행했습니다. 코드 작성과 전처리 검증을 마친 뒤에는 12에포크 학습을 백그라운드에서 돌렸습니다.

![코드 구조를 만든 뒤 MNIST 학습을 백그라운드에서 진행하는 화면](/images/posts/2026-07-26-vibe-coding-week3/06-mnist-training.webp)

생성된 파일은 역할별로 나뉘어 있었습니다.

- `preprocess.py`: 입력 이미지를 MNIST 규격에 맞게 정규화
- `model.py`: 손글씨 숫자를 분류하는 CNN 모델
- `train.py`: MNIST 학습 과정
- `predict.py`: 이미지 파일을 인식하는 CLI 기능

짧은 프롬프트 하나로 전처리, 모델 정의, 학습, 예측, 화면 구성이 파일별로 나뉘었습니다. 제가 파일마다 역할을 지정하지 않았는데도 Claude Code가 먼저 구조를 잡고 작업을 이어갔습니다.
예전에는 기능을 만들어달라고하면 해당 기능을 만들기 위해서만 나아갔다면, 지금은 좀 더 계획을 세우고 필요한 것들을 확인한 뒤에 나아가는 모습을 보였습니다.

## 실행 앱까지 완성

두 번째 프롬프트에서는 프로그램을 macOS에서 바로 열 수 있는 실행 앱으로 만들어 달라고 요청했습니다. 완성된 'Study-01' 폴더에는 소스 코드와 학습 모델뿐 아니라 테스트, 도구, 샘플, README, 요구사항 파일, 실행 로그가 정리됐습니다. 실행할 수 있는 'Digit Recognizer.app' 파일도 잘 생성된 것을 볼 수 있었습니다.

![소스 코드와 모델, 테스트, 실행 앱이 생성된 프로젝트 폴더](/images/posts/2026-07-26-vibe-coding-week3/07-app-bundle.webp)

앱을 열어 캔버스에 숫자 5를 그려봤습니다. 프로그램은 5로 인식했고, 화면에 표시된 신뢰도는 98.8%였습니다. 오른쪽에는 0부터 9까지의 점수가 막대로 표시됐고, 아래에서는 모델에 들어간 28×28 이미지도 확인할 수 있었습니다.

![현재 버전 프로그램이 손글씨 숫자 5를 98.8% 신뢰도로 인식한 결과](/images/posts/2026-07-26-vibe-coding-week3/08-current-result.webp)

손글씨가 잘 인식이 되나 보기 위해 약간은 다른 형태와 위치로 그려봤으나, 위치도 보정하고 정상적으로 인식되는 걸 볼 수 있었습니다.
예전에는 피드백을 주기전에는 중앙에서 벗어나도 인식이 잘 안되는 문제를 처음에 발생하는 걸 볼 수 있었죠.
입력 그림이 모델용 28×28 이미지로 어떻게 바뀌었는지까지 한 화면에서 볼 수 있도록 하는 부가적인 장치도 있었습니다.

### 웹 버전으로 직접 해보기

웹 버전에서는 캔버스에 숫자를 직접 그려 인식 결과를 확인할 수 있습니다.

- [손글씨 인식기 웹 버전 실행하기](https://perust.github.io/contents/digit-recognizer/)

## 이전 버전에서 만들었던 결과

아래 사진들은 이번에 새로 만든 프로그램이 아니라 이전 AI 버전으로 같은 미션을 진행했을 때 당시의 실습 이미지입니다.

<div role="region" aria-label="이전 AI 버전 손글씨 인식 결과" tabindex="0" style="display: flex; align-items: flex-start; gap: 0.8rem; overflow-x: auto; padding: 0.4rem 0 0.8rem; scroll-snap-type: x mandatory;">
  <img src="/images/posts/2026-07-26-vibe-coding-week3/01-prompt.webp" alt="이전 AI 버전에 손글씨 인식 프로그램 제작을 요청한 화면" loading="lazy" style="display: block; flex: 0 0 auto; width: auto; max-width: min(78vw, 440px); height: auto; max-height: 320px; object-fit: contain; scroll-snap-align: start; margin: 0;" />
  <img src="/images/posts/2026-07-26-vibe-coding-week3/02-desktop-initial.webp" alt="이전 AI 버전으로 만든 데스크톱 프로그램 초기 화면" loading="lazy" style="display: block; flex: 0 0 auto; width: auto; max-width: min(78vw, 440px); height: auto; max-height: 320px; object-fit: contain; scroll-snap-align: start; margin: 0;" />
  <img src="/images/posts/2026-07-26-vibe-coding-week3/03-desktop-six.webp" alt="이전 데스크톱 프로그램이 숫자 6을 인식한 결과" loading="lazy" style="display: block; flex: 0 0 auto; width: auto; max-width: min(78vw, 440px); height: auto; max-height: 320px; object-fit: contain; scroll-snap-align: start; margin: 0;" />
  <img src="/images/posts/2026-07-26-vibe-coding-week3/04-web-five.webp" alt="이전 웹 프로그램이 숫자 5를 인식한 결과" loading="lazy" style="display: block; flex: 0 0 auto; width: auto; max-width: min(78vw, 440px); height: auto; max-height: 320px; object-fit: contain; scroll-snap-align: start; margin: 0;" />
</div>

이전에는 손글씨 프로그램을 만들어 달라고 처음 요청했을때 MNIST 학습 없이 화면과 기능부터 만들어줬었습니다.
겉으로는 프로그램이 실행됐지만 손글씨 인식이 이상했었죠. 다시 프롬프트를 보내고, 학습 과정을 추가하고, 여러 번 수정한 끝에야 제대로 인식했습니다. 작업 시간도 지금보다 오래 걸렸던 것 같습니다.

지금은 첫 프롬프트에서 환경을 확인하고, MNIST를 준비하고, 코드를 기능별로 나누고, 학습까지 이어졌습니다.
현재 활용 가능한 'auto mode'가 생겼기 때문에, 지시한 뒤 계속 지켜보지 않아도 필요한 작업을 이어서 마무리 가능하기 때문에 작업 시간을 더 느끼지 못했던 것 같습니다. 

## 책이 나온 뒤에도 빠르게 발전하는 AI

이 책은 초판 발행이 2025년 12월입니다. 몇 달 사이에 책에서 설명하는 것들과 현재 활용하는 것들이 조금씩 바뀐 것도 느껴지고, AI 모델의 버전과 성능도 크게 올라갔습니다. 같은 미션을 다시 해보니 AI의 발전 속도가 새삼 빠르다고 느껴졌습니다.

예전에는 프로그램이 겉으로 실행되는지 확인한 뒤, 인식이 이상하면 원인을 다시 설명하고 학습을 추가해야 했었는데, 이번에는 두 번의 프롬프트만으로 학습 모델과 실행 앱까지 만들어 정상적으로 작동이 되고 있으니,
단순히 코드가 조금 더 잘 나온 정도가 아니라, AI가 작업에 필요한 단계를 스스로 찾아 이어가는 범위가 넓어진 것을 새삼 느낄 수 있었습니다.

## 그래도 기본은 바뀌지 않았다

성능과 작업 방식은 많이 달라졌지만 기본적인 큰 맥락은 변하지 않은 것 같습니다. 원하는 결과를 얻으려면 프롬프트를 확실하게 주고, 프로젝트 구조를 정리하며, 파일과 기능을 계층적으로 관리할 줄 알아야 합니다. 이번 첫 프롬프트에도 만들 대상, 입력 방식, 실행 요구, 코드와 주석의 언어를 분명히 적었었습니다. 프롬프트가 단순했다면 좀 더 시행착오를 겪을 수 있었겠죠.

AI가 알아서 잘 마무리해준다고 해도 결과를 직접 실행하고 확인하는 과정은 여전히 필요합니다. 최종 결과가 목적에 맞는지 판단하는 일까지 대신해주는 것은 아닙니다.

같은 과제를 예전 버전과 지금 버전으로 해봐서 차이가 더 잘 보였습니다. AI가 빨라지고 알아서 처리하는 범위가 넓어졌어도, 무엇을 만들지 분명히 적고 마지막에 직접 실행해보는 과정은 여전히 필요했습니다.

