# lentoludens blog comments

Astro/GitHub Pages 블로그에 붙일 익명 댓글 API 초안입니다.

구성:

- Cloudflare Worker: 댓글 조회/작성/관리 API
- Cloudflare D1: 댓글 저장
- Cloudflare Turnstile: 봇 방지
- IP 원문 저장 없음: `ip_hash`와 일부 마스킹된 `ip_prefix`만 저장
- 기본 상태는 `approved`: 작성 즉시 공개
- 작성자가 입력한 삭제 비밀번호의 해시를 저장해 본인 삭제를 지원
- 체크박스로 비공개 댓글을 선택하면 공개 목록에는 순서·작성 시각과 `비공개 댓글입니다.` placeholder만 표시
- 비공개 원문·닉네임·IP 일부값은 서버 projection에서 제거하고, 관리자 인증 요청에만 반환

## 1. Cloudflare 준비

```bash
cd comments-worker
npm install
npx wrangler login
npx wrangler d1 create slowave_blog_comments
```

출력된 `database_id`를 `wrangler.toml`의 `REPLACE_WITH_D1_DATABASE_ID`에 넣습니다.

## 2. DB 스키마 적용

새 원격 DB에만 전체 스키마를 적용합니다.

```bash
npx wrangler d1 execute slowave_blog_comments --remote --file=./schema.sql
```

`schema.sql`의 `CREATE TABLE IF NOT EXISTS`는 기존 테이블에 새 열을 추가하지 않습니다. 기존 DB는 먼저 D1 콘솔이나 Wrangler에서 실제 열을 확인합니다.

```sql
PRAGMA table_info(comments);
```

```bash
npx wrangler d1 execute slowave_blog_comments --remote --command="PRAGMA table_info(comments);"
```

결과에 `is_private`가 없을 때만 아래의 검증된 일회성 마이그레이션을 적용합니다. 이미 `is_private`가 있으면 이 마이그레이션을 실행하지 않습니다.

```bash
npx wrangler d1 execute slowave_blog_comments --remote \
  --file=./manual-migrations/2026-06-30-add-is-private.sql
```

실행 후 `PRAGMA table_info(comments);`를 다시 확인하고 Worker를 배포합니다.

## 3. Secret 설정

```bash
npx wrangler secret put IP_SALT
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
```

- `IP_SALT`: IP 해시에 섞을 긴 랜덤 문자열
- `ADMIN_TOKEN`: 전체 댓글 조회와 승인/거절 API 호출용 관리자 토큰. 정적 사이트 코드나 GitHub 변수에 넣지 않습니다.
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key. 개발 중에는 생략 가능하지만 운영에서는 권장

## 4. 배포

```bash
npx wrangler deploy
```

배포 후 Worker URL을 Astro 환경변수로 넣습니다.

```bash
PUBLIC_COMMENTS_API_URL=https://slowave-blog-comments.zyqn.workers.dev
PUBLIC_TURNSTILE_SITE_KEY=<turnstile-site-key>
```

GitHub Pages Actions에서 빌드한다면 repository secrets/variables에 위 값을 넣어야 합니다.

## 5. 댓글 관리자 페이지

블로그 빌드·Worker 배포 후 아래 경로에서 전체 댓글을 최신순으로 확인할 수 있습니다.

```text
https://perust.github.io/admin/comments/
```

- 페이지 HTML 자체는 GitHub Pages에서 공개될 수 있지만, 댓글 데이터는 `ADMIN_TOKEN`을 확인한 뒤에만 반환됩니다.
- 입력한 토큰은 URL이나 `localStorage`에 남기지 않고 현재 탭의 `sessionStorage`에만 보관합니다.
- 공개·비공개·숨김 댓글을 모두 표시하며, 한 번에 50개씩 불러옵니다.
- 검색엔진·사이트맵·광고·분석 스크립트에서 관리자 경로를 제외합니다.
- 로그인 후 댓글의 글 제목을 같은 탭에서 열면 해당 글의 비공개 원문을 관리자 모드로 확인할 수 있습니다.
- 관리자 모드 글에서는 토큰과 비공개 원문을 보호하기 위해 AdSense·Google Analytics·Clarity·Turnstile을 로드하지 않습니다.
- 관리자 모드 종료 또는 탭 종료 시 글은 다시 공개 placeholder 보기로 돌아갑니다.

## 6. 댓글 승인/거절

댓글은 기본적으로 `approved` 상태라 작성 즉시 공개됩니다. 문제가 있는 댓글만 아래 API나 D1 콘솔에서 `rejected`로 숨기면 됩니다.

```bash
# Authorization 헤더에는 Cloudflare secret으로 설정한 관리자 값을 넣습니다.
curl -X POST "$PUBLIC_COMMENTS_API_URL/admin/comments" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"id":"COMMENT_ID","status":"approved"}'
```

거절:

```bash
curl -X POST "$PUBLIC_COMMENTS_API_URL/admin/comments" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"id":"COMMENT_ID","status":"rejected"}'
```

## API

### `GET /comments?slug=<post-slug>`

승인된 댓글만 반환합니다. 인증 없는 요청에서도 비공개 댓글의 위치는 유지하지만, 본문은 `비공개 댓글입니다.`, 닉네임은 `비공개`, IP 일부값은 빈 문자열로 서버에서 치환하며 `isRedacted: true`를 표시합니다. 올바른 `Authorization: Bearer ***`가 있는 요청만 비공개 원문을 `isRedacted: false`로 반환하고 `Cache-Control: no-store`를 적용합니다. 잘못된 토큰은 D1 조회 전에 `401`로 거부합니다.

### `GET /admin/comments?limit=50&offset=0`

`Authorization: Bearer <ADMIN_TOKEN>` 인증이 필요합니다. 공개·비공개·숨김 댓글을 최신순으로 반환하고, 응답의 `pagination.hasMore`로 다음 페이지 존재 여부를 알 수 있습니다. 응답에는 삭제 비밀번호 해시와 전체 IP 해시를 포함하지 않으며 `Cache-Control: no-store`를 적용합니다.

### `POST /comments`

```json
{
  "postSlug": "2026-06-28-this-is-multi-agent-review",
  "nickname": "익명",
  "body": "댓글 내용",
  "deletePassword": "삭제용 비밀번호",
  "isPrivate": false,
  "turnstileToken": "..."
}
```

응답은 저장 성공과 공개/비공개 처리 메시지를 반환합니다. `isPrivate`가 `true`이면 D1에는 저장되지만 공개 댓글 목록에는 표시하지 않습니다.

### `POST /comments/delete`

```json
{
  "id": "COMMENT_ID",
  "deletePassword": "작성할 때 입력한 삭제용 비밀번호"
}
```

비밀번호가 맞으면 댓글 상태를 `rejected`로 바꿔 목록에서 숨깁니다.

## 운영 메모

- IP 전체를 공개하지 않습니다. IPv4는 `118.235.xxx.xxx`처럼 표시합니다.
- IP 원문은 저장하지 않고, `IP_SALT`를 섞은 SHA-256 해시만 저장합니다.
- 같은 IP 해시는 1분에 1개만 댓글 작성 가능하게 제한합니다.
- 링크는 2개까지만 허용합니다.
- 댓글은 800자까지 허용합니다.
