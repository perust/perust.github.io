// 2차 큐레이션 선언 매니페스트 로더와 immutable enforcement anchor 검증.
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { SECOND_CURATION_POLICY_ANCHOR } from './second-curation-policy-anchor.mjs';

export const SECOND_CURATION_MANIFEST_RELPATH =
  'content-archive/adsense-remediation/2026-07-21/second-curation-manifest.json';

const ARCHIVE_ROOT = 'content-archive/adsense-remediation/2026-07-21';
const PUBLIC_ROOTS = ['src/content/blog', 'public/images/posts', 'public/og/posts'];
const SHA256_RE = /^[0-9a-f]{64}$/;
const FILE_KINDS = new Set(['post', 'image', 'og']);
const EXPECTED_COUNTS = { post: 5, image: 11, og: 5 };

function isInside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

function safeRelativePath(rootDir, value, allowedRoots, label, problems) {
  if (typeof value !== 'string' || !value) {
    problems.push(`${label} 누락`);
    return;
  }
  const segments = value.split('/');
  if (isAbsolute(value) || value.includes('\\') || segments.some((part) => part === '' || part === '..' || part === '.')) {
    problems.push(`${label} 는 .., 절대경로, backslash, 빈 segment 없는 안전한 상대경로여야 함: ${value}`);
    return;
  }
  const allowed = allowedRoots.find((prefix) => value.startsWith(`${prefix}/`));
  if (!allowed) {
    problems.push(`${label} 는 허용 루트(${allowedRoots.join(', ')}) 바로 아래여야 함: ${value}`);
    return;
  }
  const resolvedRoot = resolve(rootDir);
  const resolvedAllowed = resolve(rootDir, allowed);
  const resolvedValue = resolve(rootDir, value);
  if (!isInside(resolvedRoot, resolvedValue) || !isInside(resolvedAllowed, resolvedValue)) {
    problems.push(`${label} resolve 결과가 저장소/허용 루트 밖임: ${value}`);
  }
}

function payloadKey(file, slug) {
  return JSON.stringify([slug, file.kind, file.publicPath, file.archivePath, file.sha256]);
}

/** 매니페스트 구조/경로/정확한 immutable policy anchor 문제 목록. */
export function validateSecondCurationManifest(manifest, rootDir = process.cwd()) {
  const problems = [];
  if (manifest?.curation !== 'adsense-remediation-second-curation') {
    problems.push('curation 은 adsense-remediation-second-curation 이어야 함');
  }
  if (manifest?.curationDate !== '2026-07-21') problems.push('curationDate 는 2026-07-21 이어야 함');
  if (manifest?.removalPolicy?.redirect !== 'none' || manifest?.removalPolicy?.expectedStatus !== 404) {
    problems.push('removalPolicy 는 redirect=none, expectedStatus=404 이어야 함');
  }
  if (!Array.isArray(manifest?.posts)) {
    problems.push('posts 배열이 없음');
    return problems;
  }
  if (manifest.posts.length !== 5) problems.push(`posts 는 정확히 5편이어야 함 (현재 ${manifest.posts.length})`);

  const slugs = new Set();
  const publicPaths = new Set();
  const archivePaths = new Set();
  const kinds = { post: 0, image: 0, og: 0 };
  const actualPayloads = [];
  for (const post of manifest.posts) {
    if (typeof post?.slug !== 'string' || !post.slug) {
      problems.push('slug 가 없는 post 항목이 있음');
      continue;
    }
    if (slugs.has(post.slug)) problems.push(`slug 중복: ${post.slug}`);
    slugs.add(post.slug);
    if (post.publicUrlPath !== `/blog/${post.slug}/`) problems.push(`${post.slug}: publicUrlPath 고정값 불일치`);
    if (!Array.isArray(post.files)) {
      problems.push(`${post.slug}: files 배열이 없음`);
      continue;
    }
    const postKinds = post.files.filter((file) => file?.kind === 'post').length;
    if (postKinds !== 1) problems.push(`${post.slug}: kind=post 항목은 정확히 1개여야 함 (현재 ${postKinds})`);
    for (const file of post.files) {
      if (!FILE_KINDS.has(file?.kind)) problems.push(`${post.slug}: 알 수 없는 kind "${file?.kind}"`);
      else kinds[file.kind] += 1;
      safeRelativePath(rootDir, file?.publicPath, PUBLIC_ROOTS, `${post.slug}: publicPath`, problems);
      safeRelativePath(rootDir, file?.archivePath, [ARCHIVE_ROOT], `${post.slug}: archivePath`, problems);
      if (publicPaths.has(file?.publicPath)) problems.push(`publicPath 중복: ${file?.publicPath}`);
      if (archivePaths.has(file?.archivePath)) problems.push(`archivePath 중복: ${file?.archivePath}`);
      publicPaths.add(file?.publicPath);
      archivePaths.add(file?.archivePath);
      if (!SHA256_RE.test(file?.sha256 ?? '')) problems.push(`${post.slug}: sha256 형식 오류`);
      actualPayloads.push(payloadKey(file, post.slug));
    }
  }

  if (actualPayloads.length !== 21) problems.push(`payload 는 정확히 21개여야 함 (현재 ${actualPayloads.length})`);
  for (const [kind, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (kinds[kind] !== expected) problems.push(`kind=${kind} 는 정확히 ${expected}개여야 함 (현재 ${kinds[kind]})`);
  }

  const expectedSlugs = SECOND_CURATION_POLICY_ANCHOR.posts.map((post) => post.slug).sort();
  const expectedUrls = SECOND_CURATION_POLICY_ANCHOR.posts.map((post) => `${post.slug}\0${post.publicUrlPath}`).sort();
  const actualUrls = manifest.posts.map((post) => `${post?.slug}\0${post?.publicUrlPath}`).sort();
  const expectedPayloads = SECOND_CURATION_POLICY_ANCHOR.posts
    .flatMap((post) => post.files.map((file) => payloadKey(file, post.slug)))
    .sort();
  if (JSON.stringify([...slugs].sort()) !== JSON.stringify(expectedSlugs)
      || JSON.stringify(actualUrls) !== JSON.stringify(expectedUrls)
      || JSON.stringify(actualPayloads.sort()) !== JSON.stringify(expectedPayloads)) {
    problems.push('고정 slug/publicUrlPath/payload가 immutable policy anchor와 일치해야 함');
  }
  if (!isDeepStrictEqual(manifest, SECOND_CURATION_POLICY_ANCHOR)) {
    problems.push('매니페스트 전체가 immutable policy anchor와 정확히 일치해야 함');
  }
  return problems;
}

export function loadSecondCurationManifest(rootDir) {
  const path = resolve(rootDir, SECOND_CURATION_MANIFEST_RELPATH);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`second-curation-manifest 를 읽을 수 없음 (${path}): ${error.message}`);
  }
  const problems = validateSecondCurationManifest(manifest, rootDir);
  if (problems.length) throw new Error(`second-curation-manifest 구조 오류: ${problems.join(' / ')}`);
  return manifest;
}

export const manifestSlugs = (manifest) => manifest.posts.map((post) => post.slug);
export const manifestFiles = (manifest) =>
  manifest.posts.flatMap((post) => post.files.map((file) => ({ slug: post.slug, ...file })));
