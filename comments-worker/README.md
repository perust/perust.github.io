# slowave blog comments

Astro/GitHub Pages 블로그에 붙일 익명 댓글 API 초안입니다.

구성:

- Cloudflare Worker: 댓글 조회/작성/관리 API
- Cloudflare D1: 댓글 저장
- Cloudflare Turnstile: 봇 방지
- IP 원문 저장 없음: `ip_hash`와 일부 마스킹된 `ip_prefix`만 저장
- 기본 상태는 `pending`: 관리자가 승인해야 공개

## 1. Cloudflare 준비

```bash
cd comments-worker
npm install
npx wrangler login
npx wrangler d1 create slowave_blog_comments
```

출력된 `database_id`를 `wrangler.toml`의 `REPLACE_WITH_D1_DATABASE_ID`에 넣습니다.

## 2. DB 스키마 적용

```bash
npx wrangler d1 execute slowave_blog_comments --file=./schema.sql
```

## 3. Secret 설정

```bash
npx wrangler secret put IP_SALT
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put TURNSTILE_SECRET_KEY
```

- `IP_SALT`: IP 해시에 섞을 긴 랜덤 문자열
- `ADMIN_TOKEN`: 댓글 승인/거절 API 호출용 관리자 토큰
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret key. 개발 중에는 생략 가능하지만 운영에서는 권장

## 4. 배포

```bash
npx wrangler deploy
```

배포 후 Worker URL을 Astro 환경변수로 넣습니다.

```bash
PUBLIC_COMMENTS_API_URL=https://slowave-blog-comments.<your-subdomain>.workers.dev
PUBLIC_TURNSTILE_SITE_KEY=<turnstile-site-key>
```

GitHub Pages Actions에서 빌드한다면 repository secrets/variables에 위 값을 넣어야 합니다.

## 5. 댓글 승인/거절

댓글은 기본적으로 `pending` 상태입니다. D1 콘솔에서 확인하거나 아래 API로 승인합니다.

```bash
# Authorization 헤더에는 Cloudflare secret으로 설정한 관리자 값을 넣습니다.
curl -X POST "$PUBLIC_COMMENTS_API_URL/admin/comments" \
  -H 'Content-Type: application/json' \
  -d '{"id":"COMMENT_ID","status":"approved"}'
```

거절:

```bash
curl -X POST "$PUBLIC_COMMENTS_API_URL/admin/comments" \
  -H 'Content-Type: application/json' \
  -d '{"id":"COMMENT_ID","status":"rejected"}'
```

## API

### `GET /comments?slug=<post-slug>`

승인된 댓글만 반환합니다.

### `POST /comments`

```json
{
  "postSlug": "2026-06-28-this-is-multi-agent-review",
  "nickname": "익명",
  "body": "댓글 내용",
  "turnstileToken": "..."
}
```

응답은 저장 성공과 승인 대기 메시지를 반환합니다.

## 운영 메모

- IP 전체를 공개하지 않습니다. IPv4는 `118.235.xxx.xxx`처럼 표시합니다.
- IP 원문은 저장하지 않고, `IP_SALT`를 섞은 SHA-256 해시만 저장합니다.
- 같은 IP 해시는 1분에 1개만 댓글 작성 가능하게 제한합니다.
- 링크는 2개까지만 허용합니다.
- 댓글은 800자까지 허용합니다.
