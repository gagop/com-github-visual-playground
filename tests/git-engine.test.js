'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { GitRepository, objectHash, sha1, validatePath } = require('../git-engine.js');
const bytes = text => Buffer.from(text, 'utf8');
function gitHash(type, input) {
  const command = spawnSync('git', ['hash-object', '-t', type, '--stdin'], { input });
  assert.equal(command.status, 0, command.stderr?.toString());
  return command.stdout.toString().trim();
}
test('SHA-1 matches standard implementation for UTF-8 and multiple blocks', () => {
  for (const text of ['', 'abc', 'Zażółć gęślą jaźń 🌿', 'a'.repeat(4097)]) {
    assert.equal(sha1(bytes(text)), crypto.createHash('sha1').update(bytes(text)).digest('hex'));
    assert.equal(objectHash('blob', bytes(text)), gitHash('blob', bytes(text)));
  }
});
test('staging captures a version; a later edit stays outside the commit', () => {
  const repo = new GitRepository(); repo.createFile('src/test.txt', 'wersja A'); repo.stage('src/test.txt');
  const staged = repo.state.index['src/test.txt']; repo.editFile('src/test.txt', 'wersja B');
  const first = repo.commit('A', 1700000000);
  assert.equal(repo.state.objects[first].snapshot['src/test.txt'], staged);
  assert.equal(repo.state.objects[staged].content, 'wersja A');
  assert.equal(repo.state.working['src/test.txt'], 'wersja B');
  assert.equal(repo.staged().length, 0); assert.equal(repo.unstaged().length, 1);
  repo.stageAll(); const second = repo.commit('B', 1700000001);
  assert.equal(repo.state.objects[second].parent, first); assert.equal(repo.tip, second);
  assert.equal(repo.unstaged().length, 0);
});
test('trees and commits have exactly the hashes produced by real Git', () => {
  const repo = new GitRepository();
  for (const name of ['a/z.txt', 'a.txt', 'a0.txt', 'żółć/🦊.txt', 'plik.txt']) repo.createFile(name, name + '\n');
  repo.stageAll(); const id = repo.commit('Migawka 🌿', 1700000000);
  for (const object of Object.values(repo.state.objects)) {
    if (object.type === 'tree') {
      const data = Buffer.concat(object.entries.map(entry => Buffer.concat([bytes(`${entry.mode} ${entry.name}\0`), Buffer.from(entry.id, 'hex')])));
      assert.equal(object.id, gitHash('tree', data));
    } else if (object.type === 'commit') assert.equal(object.id, gitHash('commit', bytes(object.raw)));
  }
  assert.equal(repo.state.objects[id].snapshot['a/z.txt'], repo.state.index['a/z.txt']);
  assert.equal(repo.state.objects[repo.state.objects[id].tree].entries[0].name, 'a.txt');
});
test('identical content is reused; unchanged trees and old snapshots survive', () => {
  const repo = GitRepository.example(), first = repo.tip;
  const initial = repo.state.objects[first], src = repo.state.objects[initial.tree].entries.find(e => e.name === 'src').id;
  const oldBlob = initial.snapshot['README.md'];
  repo.createFile('copie.md', repo.state.working['README.md']); repo.stage('copie.md');
  assert.equal(repo.state.index['copie.md'], oldBlob);
  const second = repo.commit('Dodaj kopię', 1700000002), current = repo.state.objects[second];
  assert.equal(repo.state.objects[current.tree].entries.find(e => e.name === 'src').id, src);
  assert.equal(initial.snapshot['copie.md'], undefined); assert.ok(repo.state.objects[oldBlob]);
});
test('deletions and empty folders are modeled correctly', () => {
  const repo = GitRepository.example(); repo.createFolder('pusty');
  assert.equal(repo.unstaged().length, 0);
  const oldBlob = repo.state.index['src/index.js']; repo.deletePath('src'); repo.stageAll();
  assert.equal(repo.staged().length, 2); repo.commit('Usuń src', 1700000000);
  const entries = repo.state.objects[repo.state.objects[repo.tip].tree].entries;
  assert.deepEqual(entries.map(e => e.name), ['README.md']); assert.ok(repo.state.objects[oldBlob]);
  assert.ok(repo.state.directories.includes('pusty'));
});
test('unstaging preserves working content and objects written by git add', () => {
  const repo = GitRepository.example(); repo.editFile('README.md', 'nowa treść'); repo.stage('README.md');
  const id = repo.state.index['README.md']; repo.unstage('README.md');
  assert.equal(repo.staged().length, 0); assert.equal(repo.unstaged().length, 1);
  assert.equal(repo.state.working['README.md'], 'nowa treść'); assert.ok(repo.state.objects[id]);
});
test('branches share objects, diverge, and restore their snapshots on switch', () => {
  const repo = GitRepository.example(), first = repo.tip, count = Object.keys(repo.state.objects).length;
  repo.createBranch('eksperyment'); assert.equal(Object.keys(repo.state.objects).length, count);
  repo.switchBranch('eksperyment'); repo.editFile('README.md', 'eksperyment'); repo.stageAll();
  const next = repo.commit('Na gałęzi', 1700000000);
  assert.equal(repo.state.branches.main, first); assert.equal(repo.state.branches.eksperyment, next);
  repo.switchBranch('main'); assert.notEqual(repo.state.working['README.md'], 'eksperyment');
  repo.createFile('nowy.txt', 'nieśledzony'); assert.throws(() => repo.switchBranch('eksperyment'));
});
test('invalid paths and colliding refs are rejected; special JS names work', () => {
  for (const path of ['../plik', '.git/config', 'a//b', '/plik', 'a/../b', 'a\\b', 'a\0b']) assert.throws(() => validatePath(path));
  const repo = GitRepository.example(); repo.createFile('__proto__', 'bezpieczne'); repo.stage('__proto__');
  assert.equal(repo.state.objects[repo.state.index.__proto__].content, 'bezpieczne');
  assert.throws(() => repo.createFile('src', 'kolizja')); assert.throws(() => repo.createBranch('main/kolizja'));
  assert.throws(() => repo.createBranch('bad..name')); assert.throws(() => repo.createBranch('a/.hidden'));
});
test('empty initial repository and roundtrip persistence remain usable', () => {
  const repo = GitRepository.example(false); assert.equal(repo.tip, null); assert.equal(repo.staged().length, 0);
  assert.equal(repo.unstaged().length, 3); repo.stageAll(); repo.commit('Pierwszy', 1700000000);
  const restored = new GitRepository(JSON.parse(JSON.stringify(repo.export())));
  assert.deepEqual(restored.export(), repo.export()); restored.editFile('README.md', 'dalej');
  assert.equal(restored.unstaged().length, 1);
});
test('moving a whole folder changes paths, reuses blobs, and preserves old trees', () => {
  const repo = GitRepository.example(), previous = repo.tip, blob = repo.state.index['src/index.js'];
  assert.throws(() => repo.renamePath('src', 'src/nested'));
  repo.renamePath('src', 'app/code');
  assert.equal(repo.state.index['src/index.js'], blob); assert.equal(repo.state.working['src/index.js'], undefined);
  assert.equal(repo.unstaged().length, 4); repo.stageAll(); repo.commit('Przenieś folder', 1700000000);
  assert.equal(repo.state.index['app/code/index.js'], blob);
  assert.equal(repo.state.objects[previous].snapshot['src/index.js'], blob);
});
test('staging a file in place of a directory removes colliding index entries', () => {
  const repo = GitRepository.example(); repo.deletePath('src'); repo.createFile('src', 'teraz plik'); repo.stage('src');
  assert.equal(repo.state.index['src/index.js'], undefined); assert.equal(repo.state.index['src/styles.css'], undefined);
  repo.commit('Folder staje się plikiem', 1700000000);
  assert.equal(repo.unstaged().length, 0);
});
