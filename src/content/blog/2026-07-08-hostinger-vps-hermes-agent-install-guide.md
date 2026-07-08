---
title: "Hostinger VPS에 Hermes Agent 설치하기"
description: "Hostinger VPS에서 Hermes Agent를 설치하고 모델, 도구, 게이트웨이, 예약 작업까지 운영하는 과정을 Ubuntu 기준으로 정리했습니다."
date: "2026-07-08"
category: "AI"
tags: ["HermesAgent", "Hostinger", "VPS", "AI에이전트", "자동화", "서버운영", "Slack"]
---

Hermes Agent를 제대로 쓰려면 개인 PC보다 VPS가 더 편한 경우가 많습니다. PC를 꺼도 에이전트가 계속 살아 있어야 하고, Slack·Discord·Telegram 같은 메신저에서 부르고, 정해진 시간에 자동 보고서를 보내게 만들려면 24시간 켜져 있는 서버가 필요하기 때문입니다.<br />
Hostinger VPS는 이런 용도로 시작하기 쉬운 선택지입니다. 일반 웹호스팅이 아니라 Ubuntu VPS를 만들고, 그 안에 Hermes Agent를 설치하면 개인용 AI 작업 서버처럼 쓸 수 있습니다.

![Hostinger VPS에서 Hermes Agent를 운영하는 구조](/images/posts/summary/2026-07-08-hostinger-vps-hermes-agent-install-guide-summary.svg)

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">전제</span>
    <h3>공유 호스팅이 아니라 VPS</h3>
    <p class="issue-summary">Hermes Agent는 터미널 실행, 파일 접근, 백그라운드 게이트웨이, 예약 작업이 필요합니다. 따라서 일반 웹호스팅보다 Ubuntu VPS 환경이 맞습니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">설치</span>
    <h3>공식 설치 스크립트로 시작</h3>
    <p class="issue-summary">Linux 기준 설치 명령은 <code>curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash</code>입니다. 설치 후 <code>hermes setup</code> 또는 <code>hermes model</code>로 모델 제공자를 설정합니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">운영</span>
    <h3>Gateway와 Cron까지 연결</h3>
    <p class="issue-summary">메신저에서 Hermes를 부르려면 <code>hermes gateway setup</code>을 사용합니다. 반복 보고서나 서버 점검은 <code>hermes cron</code>으로 예약할 수 있습니다.</p>
  </li>
</ul>

## Hermes Agent란?

Hermes Agent는 Nous Research가 만든 오픈소스 AI 에이전트입니다. 단순히 질문에 답하는 챗봇이 아니라, 모델이 도구를 호출해 실제 작업을 수행하는 구조입니다.

공식 문서 기준 Hermes Agent는 터미널, 파일, 웹 검색, 브라우저 자동화, 이미지 분석, 예약 작업, 메신저 게이트웨이, 스킬, 메모리 같은 기능을 지원합니다. 사용자는 CLI에서 직접 대화할 수도 있고, Slack이나 Discord 같은 메신저를 통해 같은 에이전트를 호출할 수도 있습니다.

<https://hermes-agent.nousresearch.com/docs/>

쉽게 말하면 다음에 가깝습니다.

<div class="routine-kv">
  <div><dt>일반 챗봇</dt><dd>질문을 받고 답변을 생성합니다.</dd></div>
  <div><dt>Hermes Agent</dt><dd>질문을 받고 필요한 도구를 사용해 파일 확인, 명령 실행, 웹 조사, 배포, 예약 작업까지 처리합니다.</dd></div>
  <div><dt>VPS에 설치한 Hermes</dt><dd>24시간 켜져 있는 개인 AI 작업 서버처럼 사용할 수 있습니다.</dd></div>
</div>

## 왜 Hostinger VPS인가

Hermes Agent는 로컬 노트북에도 설치할 수 있습니다. 하지만 자동화 서버로 쓰려면 VPS가 더 자연스럽습니다.

<div class="routine-grid">
  <section class="routine-card">
    <h3>항상 켜져 있는 실행 환경</h3>
    <p>메신저 게이트웨이와 예약 작업은 서버가 꺼지면 멈춥니다. VPS에 설치하면 PC 전원과 관계없이 Hermes를 계속 실행할 수 있습니다.</p>
  </section>
  <section class="routine-card">
    <h3>서버 작업과 자동화에 적합</h3>
    <p>로그 확인, Git 작업, 배포 보조, 파일 정리, RSS·뉴스 요약, 정기 점검처럼 서버에서 돌아가는 작업을 맡기기 좋습니다.</p>
  </section>
  <section class="routine-card">
    <h3>메신저 기반 운영</h3>
    <p>Slack, Discord, Telegram 등에 연결하면 터미널에 접속하지 않아도 채팅으로 서버 상태 확인이나 문서 작성 요청을 보낼 수 있습니다.</p>
  </section>
  <section class="routine-card">
    <h3>낮은 시작 비용</h3>
    <p>처음부터 큰 서버가 필요하지 않습니다. 텍스트 중심 작업과 가벼운 자동화는 작은 VPS로 시작하고, 브라우저 자동화나 동시 작업이 늘면 사양을 올리는 방식이 현실적입니다.</p>
  </section>
</div>

주의할 점도 있습니다. Hostinger의 일반 웹호스팅 상품은 PHP·워드프레스 같은 웹사이트 운영에 맞춰져 있습니다. Hermes Agent처럼 백그라운드 프로세스, 셸 명령, 사용자 홈 디렉터리 설정, 서비스 실행이 필요한 도구는 VPS에서 운영하는 편이 맞습니다.

## 준비물

설치 전에는 다음을 준비합니다.

<div class="routine-kv">
  <div><dt>Hostinger VPS</dt><dd>Ubuntu 22.04 또는 24.04 계열을 권장합니다.</dd></div>
  <div><dt>SSH 접속 정보</dt><dd>서버 IP, 사용자명, 비밀번호 또는 SSH 키가 필요합니다.</dd></div>
  <div><dt>LLM 제공자</dt><dd>Nous Portal, OpenRouter, Anthropic, OpenAI, Gemini, DeepSeek 등 하나 이상의 모델 제공자를 설정해야 합니다.</dd></div>
  <div><dt>선택 사항</dt><dd>Slack·Discord·Telegram 봇 토큰, 도메인, Webhook/API 서버용 리버스 프록시 설정입니다.</dd></div>
</div>

Hermes 공식 문서에 따르면 Linux 설치에서 핵심 전제는 Git이며, Linux에서는 `curl`과 `xz-utils`도 준비되어 있어야 합니다. Python, Node.js, ripgrep, ffmpeg 등은 설치 스크립트가 자동으로 처리합니다.

<https://hermes-agent.nousresearch.com/docs/getting-started/installation>

## 전체 설치 흐름

Hostinger VPS 기준 흐름은 아래와 같습니다.

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
apt install -y curl git xz-utils sudo ca-certificates ufw
adduser hermes
usermod -aG sudo hermes
su - hermes
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc
hermes setup
hermes
```

이 흐름만 끝내도 CLI에서 Hermes Agent를 사용할 수 있습니다. 이후 운영 목적에 따라 도구, 게이트웨이, 예약 작업, 방화벽, 도메인을 추가하면 됩니다.

## SSH 접속

Hostinger VPS를 만든 뒤에는 서버 IP로 접속합니다. 예시는 다음과 같습니다.

```bash
ssh root@YOUR_VPS_IP
```

SSH 키를 쓰는 경우에는 다음처럼 접속합니다.

```bash
ssh -i ~/.ssh/your-key.pem root@YOUR_VPS_IP
```

처음 접속한 뒤에는 서버 패키지를 업데이트합니다.

```bash
apt update && apt upgrade -y
```

기본 패키지를 설치합니다.

```bash
apt install -y curl git xz-utils sudo ca-certificates ufw
```

## 전용 사용자 생성

root 계정으로 계속 운영하는 것보다 전용 사용자를 만드는 편이 안전합니다. 여기서는 사용자명을 `hermes`로 두겠습니다.

```bash
adduser hermes
usermod -aG sudo hermes
```

이후 해당 사용자로 전환합니다.

```bash
su - hermes
```

앞으로는 가능하면 이 사용자로 접속합니다.

```bash
ssh hermes@YOUR_VPS_IP
```

## Hermes Agent 설치

Hermes Agent의 Linux 설치 명령은 공식 문서 기준 다음과 같습니다.

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

설치가 끝나면 셸 설정을 다시 불러옵니다.

```bash
source ~/.bashrc
```

설치 확인은 다음으로 합니다.

```bash
hermes --version
```

문제가 있으면 진단 명령을 먼저 실행합니다.

```bash
hermes doctor
```

일반 사용자 설치 기준 주요 경로는 다음과 같습니다.

<div class="routine-kv">
  <div><dt>실행 파일</dt><dd><code>~/.local/bin/hermes</code></dd></div>
  <div><dt>Hermes 데이터</dt><dd><code>~/.hermes/</code></dd></div>
  <div><dt>설정 파일</dt><dd><code>~/.hermes/config.yaml</code></dd></div>
  <div><dt>API 키 파일</dt><dd><code>~/.hermes/.env</code></dd></div>
  <div><dt>로그</dt><dd><code>~/.hermes/logs/</code></dd></div>
</div>

## 모델 제공자 설정

Hermes Agent는 최소 하나의 LLM 제공자가 필요합니다. 가장 쉬운 설정 방법은 대화형 모델 선택기입니다.

```bash
hermes model
```

처음부터 전체 설정을 진행하려면 다음을 사용합니다.

```bash
hermes setup
```

Nous Portal을 사용할 경우에는 다음 명령이 가장 단순합니다.

```bash
hermes setup --portal
```

Hermes 공식 문서에 따르면 Nous Portal, OpenAI Codex, GitHub Copilot, Anthropic, OpenRouter, Gemini, DeepSeek, xAI, Hugging Face, Ollama, LM Studio, Custom Endpoint 등 여러 제공자를 사용할 수 있습니다.

<https://hermes-agent.nousresearch.com/docs/integrations/providers>

API 키를 직접 넣는 방식이라면 `~/.hermes/.env`에 저장합니다.

```bash
nano ~/.hermes/.env
```

예를 들어 OpenRouter는 다음처럼 설정합니다.

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

OpenAI API를 직접 쓰는 경우는 다음과 같습니다.

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Gemini는 다음 중 하나를 사용할 수 있습니다.

```env
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

설정 후 다시 모델 선택기를 실행합니다.

```bash
hermes model
```

## 실행 테스트

설치와 모델 설정이 끝났다면 한 번만 질문해봅니다.

```bash
hermes chat -q "지금 Hermes Agent가 정상 실행되는지 한 문장으로 알려줘."
```

대화형으로 쓰려면 다음을 입력합니다.

```bash
hermes
```

이후 터미널에서 다음처럼 요청할 수 있습니다.

```text
이 서버의 디스크 사용량을 확인해줘.
```

Hermes가 terminal 도구를 사용할 수 있는 상태라면 실제 명령을 실행해 서버 상태를 확인합니다. 단, 위험한 명령은 승인 절차가 뜰 수 있습니다. 서버 운영 환경에서는 승인 절차를 유지하는 편이 안전합니다.

## 도구 설정

Hermes의 장점은 도구 사용입니다. 도구 설정은 다음 명령으로 엽니다.

```bash
hermes tools
```

처음 VPS에서 운영한다면 다음 도구가 특히 유용합니다.

<ul class="issue-list">
  <li class="issue-card"><h3>terminal</h3><p class="issue-summary">서버 명령 실행, 프로세스 확인, 패키지 설치, 로그 확인에 사용합니다.</p></li>
  <li class="issue-card"><h3>file</h3><p class="issue-summary">파일 읽기, 쓰기, 검색, 패치에 사용합니다. 블로그 글 작성이나 설정 수정에도 필요합니다.</p></li>
  <li class="issue-card"><h3>web</h3><p class="issue-summary">웹 검색과 문서 확인에 사용합니다. 최신 문서를 바탕으로 리서치할 때 유용합니다.</p></li>
  <li class="issue-card"><h3>cronjob</h3><p class="issue-summary">정기 보고서, 서버 점검, 뉴스 요약 같은 반복 작업을 예약합니다.</p></li>
  <li class="issue-card"><h3>skills와 memory</h3><p class="issue-summary">반복 작업 절차와 사용자 선호를 저장해 다음 세션에서 이어서 활용합니다.</p></li>
</ul>

도구를 바꾼 뒤에는 새 세션에서 반영됩니다. CLI라면 종료 후 다시 실행하고, Gateway라면 재시작합니다.

## Gateway 설정

Hermes Gateway는 Hermes를 메신저와 연결하는 백그라운드 프로세스입니다. Slack, Discord, Telegram, Email, Webhooks, API Server 등 여러 채널을 연결할 수 있습니다.

공식 문서 기준 Gateway 설정 명령은 다음과 같습니다.

```bash
hermes gateway setup
```

포그라운드에서 테스트하려면 다음을 실행합니다.

```bash
hermes gateway run
```

서비스로 설치하려면 다음을 사용합니다.

```bash
hermes gateway install
```

시작, 중지, 상태 확인 명령은 다음과 같습니다.

```bash
hermes gateway start
hermes gateway stop
hermes gateway restart
hermes gateway status
```

Gateway 공식 문서도 같이 확인하는 것이 좋습니다.

<https://hermes-agent.nousresearch.com/docs/user-guide/messaging/>

Hostinger VPS에서 SSH 로그아웃 후에도 사용자 서비스가 살아 있어야 한다면 linger 설정을 추가합니다.

```bash
sudo loginctl enable-linger hermes
```

여기서 `hermes`는 앞에서 만든 사용자명입니다.

## Slack 또는 Discord에서 쓰는 방식

메신저 연동의 장점은 터미널에 직접 접속하지 않아도 Hermes를 부를 수 있다는 점입니다.

예를 들어 Slack에 연결해두면 다음처럼 요청할 수 있습니다.

```text
서버 상태 점검해줘.
```

```text
오늘 AI 뉴스 중 블로그에 쓸 만한 주제 5개만 골라줘.
```

```text
매일 오전 8시에 서버 상태와 주요 뉴스를 요약해서 보내줘.
```

Discord를 쓸 경우에는 Discord Developer Portal에서 봇을 만들고 토큰을 발급받아 Gateway 설정에 넣습니다. Slack은 Slack App 생성, Bot Token, Event Subscription, 권한 설정이 필요합니다. 플랫폼마다 설정값이 다르므로 `hermes gateway setup`의 안내를 따라 입력하는 것이 가장 안전합니다.

## 예약 작업 설정

Hermes는 Cron 기능으로 반복 작업을 실행할 수 있습니다. 예를 들어 매일 오전 9시에 서버 상태를 점검하게 만들 수 있습니다.

```bash
hermes cron create "0 9 * * *" "서버의 CPU, 메모리, 디스크 상태를 확인하고 이상 징후가 있으면 요약해줘."
```

2시간마다 실행하려면 다음처럼 쓸 수 있습니다.

```bash
hermes cron create "every 2h" "서버 상태를 확인하고 문제가 있으면 알려줘."
```

Cron 작업 목록은 다음으로 확인합니다.

```bash
hermes cron list
```

수동 실행은 다음입니다.

```bash
hermes cron run JOB_ID
```

일시정지와 재개는 다음처럼 합니다.

```bash
hermes cron pause JOB_ID
hermes cron resume JOB_ID
```

삭제는 다음입니다.

```bash
hermes cron remove JOB_ID
```

Hermes Cron은 단순 알림뿐 아니라 스킬을 불러와 작업하거나, 특정 채널로 결과를 보내거나, 스크립트 출력만 전달하는 방식도 지원합니다.

<https://hermes-agent.nousresearch.com/docs/user-guide/features/cron>

## 도메인과 HTTPS

CLI와 메신저만 쓴다면 도메인이 꼭 필요하지는 않습니다. 하지만 Webhook이나 API Server를 외부에서 호출하려면 도메인과 HTTPS가 있는 편이 좋습니다.

예를 들어 다음처럼 서브도메인을 만들 수 있습니다.

<div class="routine-kv">
  <div><dt>도메인</dt><dd><code>example.com</code></dd></div>
  <div><dt>서브도메인</dt><dd><code>hermes.example.com</code></dd></div>
  <div><dt>DNS A 레코드</dt><dd>Hostinger VPS IP 주소</dd></div>
</div>

서버에서는 Caddy나 Nginx를 리버스 프록시로 둘 수 있습니다. Caddy를 쓰면 HTTPS 인증서 관리가 비교적 쉽습니다.

예시 Caddyfile은 다음과 같습니다.

```caddy
hermes.example.com {
    reverse_proxy 127.0.0.1:8000
}
```

실제 포트는 Hermes Gateway나 API Server 설정에 맞춰야 합니다. 가능하면 내부 포트를 외부에 직접 열지 말고, HTTPS 프록시 뒤에 두는 편이 안전합니다.

## 방화벽 설정

VPS에서는 방화벽을 최소한으로 열어두는 것이 좋습니다.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

상태 확인은 다음입니다.

```bash
sudo ufw status
```

메신저 게이트웨이만 쓴다면 대부분 80·443 외의 포트를 직접 열 필요가 없습니다. Webhook이나 API 서버를 별도 포트로 열어야 한다면, 먼저 리버스 프록시 구성을 검토하는 편이 좋습니다.

## 운영 체크리스트

설치 후에는 아래 순서로 점검합니다.

<div class="routine-template">
  <h3>설치 직후 확인</h3>
  <ul>
    <li><code>hermes --version</code>으로 실행 파일 확인</li>
    <li><code>hermes doctor</code>로 의존성·설정 확인</li>
    <li><code>hermes model</code>로 모델 제공자 확인</li>
    <li><code>hermes chat -q "테스트"</code>로 모델 호출 확인</li>
  </ul>
</div>

<div class="routine-template">
  <h3>Gateway 운영 확인</h3>
  <ul>
    <li><code>hermes gateway setup</code>으로 플랫폼 설정</li>
    <li><code>hermes gateway run</code>으로 먼저 포그라운드 테스트</li>
    <li><code>hermes gateway install</code> 후 서비스 등록</li>
    <li><code>hermes gateway status</code>로 서비스 상태 확인</li>
    <li><code>tail -f ~/.hermes/logs/gateway.log</code>로 로그 확인</li>
  </ul>
</div>

## 자주 생기는 문제

### hermes 명령을 찾을 수 없음

설치 후 셸 경로가 반영되지 않았을 가능성이 있습니다.

```bash
source ~/.bashrc
which hermes
```

일반 사용자 설치라면 보통 `~/.local/bin/hermes`에 연결됩니다.

### 모델 호출 실패

모델 제공자 설정과 API 키를 다시 확인합니다.

```bash
hermes model
hermes doctor
nano ~/.hermes/.env
```

API 키를 바꾼 뒤에는 새 세션에서 다시 테스트합니다.

### Gateway가 응답하지 않음

상태와 로그를 먼저 봅니다.

```bash
hermes gateway status
tail -f ~/.hermes/logs/gateway.log
```

설정을 바꾼 뒤에는 재시작합니다.

```bash
hermes gateway restart
```

### SSH 로그아웃 후 멈춤

사용자 서비스가 로그아웃 후에도 살아 있어야 한다면 linger를 확인합니다.

```bash
sudo loginctl enable-linger hermes
```

간단 테스트만 할 때는 `tmux`도 사용할 수 있습니다.

```bash
sudo apt install -y tmux
tmux new -s hermes
hermes
```

빠져나올 때는 `Ctrl + B`, 그 다음 `D`를 누릅니다. 다시 들어가려면 다음을 사용합니다.

```bash
tmux attach -t hermes
```

## 보안상 주의할 점

Hermes Agent는 강력한 도구입니다. 그래서 서버 운영에서는 편의보다 안전을 먼저 봐야 합니다.

<ul class="issue-list">
  <li class="issue-card"><h3>API 키를 공개 저장소에 올리지 않기</h3><p class="issue-summary"><code>~/.hermes/.env</code>는 비밀값 저장소입니다. GitHub나 블로그에 그대로 올리면 안 됩니다.</p></li>
  <li class="issue-card"><h3>root 상시 운영 피하기</h3><p class="issue-summary">전용 사용자를 만들고 필요한 권한만 부여하는 편이 안전합니다.</p></li>
  <li class="issue-card"><h3>방화벽 최소화</h3><p class="issue-summary">SSH, HTTP, HTTPS처럼 필요한 포트만 엽니다. 내부 앱 포트를 무작정 외부에 열지 않습니다.</p></li>
  <li class="issue-card"><h3>위험 명령 자동 승인 주의</h3><p class="issue-summary"><code>--yolo</code>나 승인 우회 설정은 편하지만, 운영 서버에서는 삭제·초기화 같은 명령이 바로 실행될 수 있어 신중해야 합니다.</p></li>
</ul>

## 투자자로서의 관점

Hermes Agent를 Hostinger VPS에 올려 쓰는 방식은 단순한 설치 팁을 넘어 AI 에이전트 시장의 방향을 보여줍니다. 모델 자체보다 “모델이 계속 일할 수 있는 실행 환경”이 중요해지고 있기 때문입니다.

<div class="routine-grid">
  <section class="routine-card">
    <span class="issue-badge">1순위</span>
    <h3>개인 자동화 서버 수요</h3>
    <p>AI 에이전트가 일상 업무에 들어오면 24시간 켜져 있는 작은 서버 수요가 늘 수 있습니다. Hostinger, Hetzner, DigitalOcean, Fly.io, Railway 같은 저비용 인프라가 개인·소규모 팀의 실험 공간이 됩니다.</p>
  </section>
  <section class="routine-card">
    <span class="issue-badge">2순위</span>
    <h3>메신저 기반 운영 도구</h3>
    <p>앞으로는 관리자 페이지보다 Slack·Discord에서 “서버 점검해줘”, “배포 로그 봐줘”라고 말하는 방식이 더 자연스러워질 수 있습니다. 업무용 메신저와 에이전트 게이트웨이의 결합을 볼 필요가 있습니다.</p>
  </section>
  <section class="routine-card">
    <span class="issue-badge">3순위</span>
    <h3>보안과 권한 관리</h3>
    <p>에이전트가 서버 명령과 파일을 다루면 권한, 감사 로그, 비밀키 관리가 중요해집니다. 에이전트 도입이 늘수록 보안·거버넌스 도구의 가치도 함께 커질 수 있습니다.</p>
  </section>
  <section class="routine-card">
    <span class="issue-badge">4순위</span>
    <h3>모델보다 워크플로우</h3>
    <p>모델 성능은 계속 경쟁하며 평준화될 수 있습니다. 반면 개인의 스킬, 메모리, 예약 작업, 서버 권한, 메신저 연결은 시간이 쌓일수록 쉽게 대체하기 어려운 워크플로우 자산이 됩니다.</p>
  </section>
</div>

투자 판단에서는 “어떤 모델이 가장 똑똑한가”만 볼 것이 아니라, 에이전트가 실제 업무 환경에 얼마나 깊게 연결되는지 봐야 합니다. 서버, 메신저, 인증, 비용 관리, 보안이 함께 움직이는 시장입니다.

## 마지막으로

Hostinger VPS에 Hermes Agent를 설치하면 개인용 AI 작업 서버를 비교적 쉽게 만들 수 있습니다. 처음에는 CLI에서 한 줄 질문으로 시작하고, 익숙해지면 Gateway와 Cron을 붙여 메신저 자동화 서버로 확장하면 됩니다.

가장 짧은 설치 흐름은 아래와 같습니다.

```bash
ssh root@YOUR_VPS_IP
apt update && apt upgrade -y
apt install -y curl git xz-utils sudo ca-certificates ufw
adduser hermes
usermod -aG sudo hermes
su - hermes
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc
hermes setup
hermes
```

여기까지 끝나면 Hostinger VPS 위에서 Hermes Agent를 실행할 준비가 됩니다. 이후에는 모델 제공자, 도구, 메신저, 예약 작업을 하나씩 붙이면서 자신에게 맞는 개인 AI 운영 환경으로 키워가면 됩니다.
