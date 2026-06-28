# perust.github.io

임승우(Seungwoo)의 개인 홈페이지이자 웹 실습/작업물 아카이브입니다. 메인 페이지에는 현재 관심사, 프로젝트, 작업 원칙, 과거 퍼블리싱/프론트엔드 실습 결과물을 정리합니다.

## 주요 내용

- 개인 소개 및 포커스 영역
- 진행/완료 프로젝트 카드
- 작업 원칙과 연락 섹션
- 과거 웹 퍼블리싱·JavaScript 실습 아카이브
- 정적 HTML/CSS/JavaScript 기반 GitHub Pages 사이트

## 프로젝트 구조

```text
.
├── index.html              # 현재 개인 홈페이지 메인
├── index.css               # 메인 스타일
├── contents/               # 게임/프로그램 실습 콘텐츠
│   ├── calculator.html
│   ├── number-baseball.html
│   └── word-relay.html
├── homepage/               # 퍼블리싱 실습/클론 코딩 아카이브
└── study/                  # 강의·학습 결과물
```

## 로컬 실행

정적 사이트이므로 파일을 직접 열거나 간단한 로컬 서버로 확인할 수 있습니다.

```bash
git clone https://github.com/perust/perust.github.io.git
cd perust.github.io
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`에 접속합니다.

## 배포

GitHub Pages용 사용자 사이트 저장소입니다. `main` 브랜치에 반영된 정적 파일이 GitHub Pages로 서비스됩니다.

## 아카이브

`contents/`, `homepage/`, `study/`에는 이전 실습 결과물이 보존되어 있습니다. 메인 페이지는 최신 자기소개/프로젝트 허브 역할을 하고, 하위 폴더는 과거 작업물을 참고하기 위한 아카이브로 사용합니다.
