#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const fail = message => { throw new Error(message); };
function git(root, args, options = {}) {
  return execFileSync('git', ['-C', root, ...args], { maxBuffer: 32 * 1024 * 1024, ...options });
}
function text(root, args) { return git(root, args).toString().trim(); }
function inventory(root, ref) {
  return git(root, ['ls-tree', '-rlz', ref, '--', '.eval-artifacts']).toString().split('\0').filter(Boolean).map(row => {
    const [metadata, path] = row.split('\t'), [mode, kind, oid, bytes] = metadata.trim().split(/\s+/);
    if (kind !== 'blob' || !['100644', '100755'].includes(mode)) fail('Eval fixture must be a regular Git blob: ' + path);
    return { path, oid, bytes: Number(bytes) };
  });
}
function safeEvalPath(path) {
  if (!path.startsWith('.eval-artifacts/') || path.split('/').some(part => !part || part === '.' || part === '..') || /[\r\n\0\\]/.test(path)) fail('Invalid eval path: ' + path);
  return path;
}
const escapePattern = path => path.replace(/[\[\]*?\\]/g, '\\$&');
function patterns(files) {
  const tree = Object.create(null);
  for (const file of files) {
    const parts = safeEvalPath(file).split('/').slice(1); let node = tree;
    for (const part of parts.slice(0, -1)) node = node[part] ??= Object.create(null);
    node[parts.at(-1)] = null;
  }
  const rows = ['/*', '!/.eval-artifacts/*'];
  function walk(node, path) {
    for (const name of Object.keys(node).sort()) {
      const next = path + '/' + name, escaped = escapePattern(next);
      if (node[name] === null) rows.push(escaped);
      else { rows.push(escaped + '/', '!' + escaped + '/*'); walk(node[name], next); }
    }
  }
  walk(tree, '/.eval-artifacts'); return rows.join('\n') + '\n';
}
function control(root) { return resolve(root, text(root, ['rev-parse', '--git-dir'])); }
function applySelection(root, files) {
  const info = resolve(control(root), 'info'); mkdirSync(info, { recursive: true });
  writeFileSync(resolve(info, 'sparse-checkout'), patterns(files));
  git(root, ['read-tree', '-mu', 'HEAD']);
}
function measure(root) {
  const result = { files: 0, logicalBytes: 0, allocatedBytes: 0 };
  function walk(path) {
    if (!existsSync(path)) return;
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = resolve(path, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile()) { const stat = statSync(file); result.files++; result.logicalBytes += stat.size; result.allocatedBytes += stat.blocks * 512; }
      else fail('Unexpected link in eval checkout: ' + file);
    }
  }
  walk(resolve(root, '.eval-artifacts')); return result;
}
function saveState(root, state) { writeFileSync(resolve(control(root), 'praxis-worktree.json'), JSON.stringify(state, null, 2) + '\n'); }

function create(path, options) {
  const source = text(resolve(options.repo ?? '.'), ['rev-parse', '--show-toplevel']);
  if (text(source, ['config', '--get', 'extensions.worktreeConfig']) !== 'true') fail('Praxis requires extensions.worktreeConfig=true; no shared configuration was changed.');
  const revision = options.ref ?? 'main';
  if (revision.startsWith('-')) fail('Invalid ref');
  const sha = text(source, ['rev-parse', '--verify', revision + '^{commit}']);
  const root = resolve(path);
  try { lstatSync(root); fail('Destination already exists: ' + root); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!options.branch && !options.detach) fail('Specify --branch codex/<purpose> or --detach');
  if (options.branch && (options.detach || !/^codex\/(?:adr-\d+|feat|fix|docs|chore)-[a-z0-9-]+$/.test(options.branch))) fail('Invalid Praxis branch name or conflicting --detach');
  const manifest = JSON.parse(readFileSync(new URL('./worktree-fixtures.json', import.meta.url), 'utf8'));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) fail('Invalid verified fixture manifest');
  const wanted = new Set(manifest.files.map(safeEvalPath)), all = inventory(source, sha), selected = all.filter(row => wanted.has(row.path));
  mkdirSync(dirname(root), { recursive: true });
  git(source, ['worktree', 'add', '--no-checkout', ...(options.branch ? ['-b', options.branch] : ['--detach']), root, sha]);
  const before = measure(root); if (before.files) fail('Worktree was unexpectedly populated before sparse configuration');
  git(root, ['config', '--worktree', 'core.sparseCheckout', 'true']);
  git(root, ['config', '--worktree', 'core.sparseCheckoutCone', 'false']);
  const files = selected.map(row => row.path).sort();
  applySelection(root, files);
  const state = { schemaVersion: 1, baseSha: sha, fixtureFiles: files, batches: [] }; saveState(root, state);
  const checkedOut = measure(root);
  if (checkedOut.files !== selected.length || checkedOut.logicalBytes !== selected.reduce((sum, row) => sum + row.bytes, 0)) fail('Sparse fixture checkout did not match the verified manifest');
  return { command: 'create', root, sha, branch: options.branch ?? null, firstCheckout: true, evalBeforeCheckout: before, evalAfterCheckout: checkedOut, omittedEvalFiles: all.length - selected.length, omittedEvalLogicalBytes: all.reduce((sum, row) => sum + row.bytes, 0) - checkedOut.logicalBytes };
}
function restore(path, batch) {
  const root = resolve(path), statePath = resolve(control(root), 'praxis-worktree.json');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  if (state.schemaVersion !== 1 || text(root, ['rev-parse', 'HEAD']) !== state.baseSha) fail('Worktree HEAD differs from its creation snapshot');
  if (text(root, ['status', '--porcelain', '--untracked-files=no'])) fail('Commit or save tracked changes before restoring a historical batch');
  const prefix = safeEvalPath(batch.startsWith('.eval-artifacts/') ? batch : '.eval-artifacts/' + batch);
  const all = inventory(root, state.baseSha), rows = all.filter(row => row.path.startsWith(prefix + '/'));
  if (!rows.length) fail('Historical batch is absent from this exact commit: ' + prefix);
  const existing = new Set(state.fixtureFiles);
  for (const old of state.batches) for (const row of all) if (row.path.startsWith(old + '/')) existing.add(row.path);
  for (const row of rows) {
    const file = resolve(root, row.path);
    if (existsSync(file) && text(root, ['hash-object', '--', file]) !== row.oid) fail('Refusing to replace modified batch file: ' + row.path);
    existing.add(row.path);
  }
  applySelection(root, [...existing].sort());
  if (!state.batches.includes(prefix)) state.batches.push(prefix); saveState(root, state);
  return { command: 'restore', root, sha: state.baseSha, batch: prefix, batchFiles: rows.length, batchLogicalBytes: rows.reduce((sum, row) => sum + row.bytes, 0), evalAfterRestore: measure(root) };
}
// Existing/dirty worktrees may need a missing test input without changing code or HEAD.
function check(path) {
  const root = resolve(path);
  if (text(root, ['config', '--bool', '--default', 'false', '--get', 'core.sparseCheckout']) !== 'true') fail('Sparse checkout is required. Do not disable it to fix missing fixtures; restore only explicit required files with the fixtures command. Existing full trees require a separate preservation audit before folding history.');
  if (text(root, ['config', '--bool', '--default', 'false', '--get', 'core.sparseCheckoutCone']) === 'true') fail('Praxis eval fixtures require non-cone sparse checkout');
  const entries = git(root, ['ls-files', '-t', '-z', '--', '.eval-artifacts']).toString().split('\0').filter(Boolean);
  if (entries.length && !entries.some(line => line.startsWith('S '))) {
    const verified = new Set(JSON.parse(readFileSync(new URL('./worktree-fixtures.json', import.meta.url), 'utf8')).files);
    if (entries.some(line => !verified.has(line.slice(2)))) fail('All tracked eval history is selected. Preserve local work and audit this tree before folding history; do not use whole-history sparse patterns.');
  }
  return { command: 'check', root, sparse: true };
}
function fixtures(path, requested) {
  const root = resolve(path); check(root);
  if (text(root, ['ls-files', '--unmerged'])) fail('Resolve the unmerged index before restoring fixtures');
  const names = [...new Set(requested.map(name => safeEvalPath(name.startsWith('.eval-artifacts/') ? name : '.eval-artifacts/' + name)))];
  if (!names.length) fail('Specify exact required files, not a batch directory or wildcard');
  const all = inventory(root, 'HEAD'), byPath = new Map(all.map(row => [row.path, row]));
  const rows = names.map(name => byPath.get(name) ?? fail('Not an exact file in current HEAD: ' + name));
  const indexed = new Map(git(root, ['ls-files', '--stage', '-z', '--', '.eval-artifacts']).toString().split('\0').filter(Boolean).map(line => {
    const [metadata, name] = line.split('\t'), [mode, oid] = metadata.split(' '); return [name, { mode, oid }];
  }));
  const visibility = new Map(git(root, ['ls-files', '-t', '-z', '--', '.eval-artifacts']).toString().split('\0').filter(Boolean).map(line => [line.slice(2), line[0]]));
  for (const row of rows) {
    if (indexed.get(row.path)?.oid !== row.oid || indexed.get(row.path)?.mode !== row.mode) fail('Refusing staged fixture changes: ' + row.path);
    const file = resolve(root, row.path);
    try {
      const stat = lstatSync(file);
      if (!stat.isFile() || text(root, ['hash-object', '--', file]) !== row.oid) fail('Refusing local fixture changes: ' + row.path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (visibility.get(row.path) !== 'S') fail('Refusing a local fixture deletion: ' + row.path);
    }
  }
  const selected = new Set(git(root, ['ls-files', '-t', '-z', '--', '.eval-artifacts']).toString().split('\0').filter(Boolean).filter(line => !line.startsWith('S ')).map(line => line.slice(2)));
  for (const name of names) selected.add(name);
  const patternPath = resolve(control(root), 'info/sparse-checkout'), previous = readFileSync(patternPath, 'utf8');
  const before = text(root, ['status', '--porcelain', '--untracked-files=no']);
  // Override only eval selection; keep this tree's existing code/document selection intact.
  const marker = '# Praxis exact eval fixtures\n';
  const original = previous.split(marker)[0];
  writeFileSync(patternPath, original + '\n' + marker + patterns([...selected].sort()).split('\n').slice(1).join('\n'));
  git(root, ['sparse-checkout', 'reapply']);
  if (text(root, ['status', '--porcelain', '--untracked-files=no']) !== before) fail('Tracked changes unexpectedly differ; inspect this tree before continuing');
  for (const row of rows) if (text(root, ['hash-object', '--', resolve(root, row.path)]) !== row.oid) fail('Restored fixture does not match HEAD: ' + row.path);
  return { command: 'fixtures', root, sha: text(root, ['rev-parse', 'HEAD']), files: names, logicalBytes: rows.reduce((sum, row) => sum + row.bytes, 0), evalAfterRestore: measure(root) };
}
function main(args) {
  const command = args.shift();
  if (!command || command === '--help') { console.log('Praxis worktrees:\n  node scripts/praxis-worktree.mjs create <path> --branch codex/chore-<name> [--ref main] [--repo <checkout>]\n  node scripts/praxis-worktree.mjs create <path> --detach --ref <commit>\n  node scripts/praxis-worktree.mjs restore <path> <historical-batch>\n  node scripts/praxis-worktree.mjs fixtures <existing-tree> <exact-eval-file> [...]\n  node scripts/praxis-worktree.mjs check <existing-tree>'); return; }
  const path = args.shift(); if (!path) fail('Missing worktree path');
  if (command === 'check') { if (args.length) fail('check takes only a worktree path'); return check(path); }
  if (command === 'fixtures') return fixtures(path, args);
  if (command === 'restore') { const batch = args.shift(); if (!batch || args.length) fail('restore requires exactly one historical batch'); return restore(path, batch); }
  if (command !== 'create') fail('Unknown command: ' + command);
  const options = {};
  while (args.length) { const option = args.shift(); if (option === '--detach') options.detach = true; else if (['--ref', '--branch', '--repo'].includes(option) && args.length) options[option.slice(2)] = args.shift(); else fail('Unknown or incomplete option: ' + option); }
  return create(path, options);
}
try { const result = main(process.argv.slice(2)); if (result) console.log(JSON.stringify(result, null, 2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
