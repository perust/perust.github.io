-- 기존 comments 테이블에 비공개 댓글 표시 열을 추가한다.
-- 새 데이터베이스는 schema.sql에 이 열이 이미 있으므로 이 파일을 실행하지 않는다.
ALTER TABLE comments ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;
