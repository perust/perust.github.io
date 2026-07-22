// dist HTML 스캔 공용 헬퍼 — check-content-quality.mjs 와 check-publish-policy.mjs 가 공유한다.
import { readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

// 보존용 레거시 정적 아카이브 — 내부 링크 검사에서 제외한다.
export const LEGACY_PREFIXES = ['contents/', 'homepage/', 'study/'];

export const toPosix = (p) => p.split(sep).join('/');

export function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}
