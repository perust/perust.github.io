// Git 기반 발행 정책 헬퍼: 신규 글 기준선 해석과 파일 추적 가능 여부 판정.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function git(rootDir, args) {
  const result = spawnSync('git', args, { cwd: rootDir, encoding: 'utf8' });
  return { status: result.status, stdout: (result.stdout ?? '').trim() };
}

export function isGitRepo(rootDir) {
  const result = git(rootDir, ['rev-parse', '--is-inside-work-tree']);
  return result.status === 0 && result.stdout === 'true';
}

/**
 * 명시한 POLICY_GIT_BASELINE은 fail-closed다. 비어 있으면 로컬 checkout에 한해
 * upstream/origin merge-base, 마지막으로 HEAD를 사용한다. CI committed-diff 모드는
 * POLICY_REQUIRE_COMMITTED_DIFF=true와 명시 기준선을 요구하며 HEAD 자체를 거부한다.
 */
export function resolveBaseline(rootDir, env = process.env) {
  const warnings = [];
  const errors = [];
  const requireCommittedDiff = env.POLICY_REQUIRE_COMMITTED_DIFF === 'true';
  const hasOverride = Object.hasOwn(env, 'POLICY_GIT_BASELINE');
  const override = hasOverride ? String(env.POLICY_GIT_BASELINE ?? '').trim() : '';

  if (override) {
    if (/^0+$/.test(override)) {
      errors.push('POLICY_GIT_BASELINE 이 all-zero SHA라 명시 기준선을 신뢰할 수 없음');
      return { ref: null, source: 'invalid env:POLICY_GIT_BASELINE', warnings, errors, requireCommittedDiff };
    }
    const resolved = git(rootDir, ['rev-parse', '--verify', '--quiet', `${override}^{commit}`]);
    if (resolved.status !== 0 || !resolved.stdout) {
      errors.push(`POLICY_GIT_BASELINE="${override}" 를 reachable commit으로 해석할 수 없음`);
      return { ref: null, source: 'invalid env:POLICY_GIT_BASELINE', warnings, errors, requireCommittedDiff };
    }
    const head = git(rootDir, ['rev-parse', '--verify', '--quiet', 'HEAD']);
    if (requireCommittedDiff && head.status === 0 && resolved.stdout === head.stdout) {
      errors.push('committed-diff 명시 모드에서는 POLICY_GIT_BASELINE==HEAD를 허용하지 않음');
      return { ref: null, source: 'invalid env:POLICY_GIT_BASELINE==HEAD', warnings, errors, requireCommittedDiff };
    }
    return { ref: resolved.stdout, source: 'env:POLICY_GIT_BASELINE', warnings, errors, requireCommittedDiff };
  }

  if (requireCommittedDiff) {
    errors.push('committed-diff 명시 모드는 nonempty POLICY_GIT_BASELINE을 요구함');
    return { ref: null, source: 'missing env:POLICY_GIT_BASELINE', warnings, errors, requireCommittedDiff };
  }

  const candidates = [
    ['@{upstream}', 'merge-base(HEAD, @{upstream})'],
    ['origin/main', 'merge-base(HEAD, origin/main)'],
  ];
  for (const [candidate, source] of candidates) {
    if (git(rootDir, ['rev-parse', '--verify', '--quiet', candidate]).status !== 0) continue;
    const base = git(rootDir, ['merge-base', 'HEAD', candidate]);
    if (base.status === 0 && base.stdout) return { ref: base.stdout, source, warnings, errors, requireCommittedDiff };
  }
  const head = git(rootDir, ['rev-parse', '--verify', '--quiet', 'HEAD']);
  if (head.status === 0) return { ref: head.stdout, source: 'HEAD(local working-tree mode)', warnings, errors, requireCommittedDiff };
  errors.push('git 기준선을 해석할 수 없음 (HEAD 없음)');
  return { ref: null, source: 'none', warnings, errors, requireCommittedDiff };
}

/** baseline 트리에 존재하는 글 파일 이름 집합. 실패하면 null. */
export function postsAtRef(rootDir, ref, blogDir = 'src/content/blog') {
  const result = git(rootDir, ['ls-tree', '--name-only', ref, `${blogDir}/`]);
  if (result.status !== 0) return null;
  return new Set(result.stdout.split('\n').filter((line) => line.endsWith('.md')).map((line) => line.slice(blogDir.length + 1)));
}

export function detectNewPostFiles(rootDir, currentFiles, env = process.env) {
  if (!isGitRepo(rootDir)) {
    const baseline = { ref: null, source: 'none', warnings: [], errors: ['git 저장소가 아니어서 신규 글 감지 불가'] };
    return { ok: false, baseline, newFiles: [] };
  }
  const baseline = resolveBaseline(rootDir, env);
  if (!baseline.ref) return { ok: false, baseline, newFiles: [] };
  const baselinePosts = postsAtRef(rootDir, baseline.ref);
  if (baselinePosts === null) {
    baseline.errors.push(`git ls-tree ${baseline.ref} 실패 — postsAtRef 신규 글 감지 불가`);
    return { ok: false, baseline, newFiles: [] };
  }
  return { ok: true, baseline, newFiles: currentFiles.filter((file) => !baselinePosts.has(file)).sort() };
}

export function gitTrackableState(rootDir, relPath) {
  if (!existsSync(join(rootDir, relPath))) return { ok: false, state: 'missing' };
  if (!isGitRepo(rootDir)) return { ok: true, state: 'no-git' };
  if (git(rootDir, ['ls-files', '--error-unmatch', '--', relPath]).status === 0) return { ok: true, state: 'tracked' };
  if (git(rootDir, ['check-ignore', '-q', '--', relPath]).status === 0) return { ok: false, state: 'ignored' };
  return { ok: true, state: 'untracked-trackable' };
}
