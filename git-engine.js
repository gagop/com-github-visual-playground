/* A small, offline Git object model. Objects use Git's actual SHA-1 encoding. */
(function (root) {
  'use strict';
  const utf8 = new TextEncoder();
  const own = (map, key) => Object.prototype.hasOwnProperty.call(map, key);
  const copy = value => JSON.parse(JSON.stringify(value));
  const map = source => Object.assign(Object.create(null), source);
  function concat(...parts) {
    const bytes = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return bytes;
  }
  function sha1(bytes) {
    const size = Math.ceil((bytes.length + 9) / 64) * 64;
    const data = new Uint8Array(size);
    data.set(bytes); data[bytes.length] = 128;
    const view = new DataView(data.buffer);
    view.setUint32(size - 8, Math.floor(bytes.length / 0x20000000));
    view.setUint32(size - 4, (bytes.length * 8) >>> 0);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476, e0 = 0xc3d2e1f0;
    const rotate = (v, n) => (v << n) | (v >>> (32 - n));
    const words = new Int32Array(80);
    for (let block = 0; block < size; block += 64) {
      for (let i = 0; i < 16; i++) words[i] = view.getInt32(block + i * 4);
      for (let i = 16; i < 80; i++) words[i] = rotate(words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16], 1);
      let a = a0, b = b0, c = c0, d = d0, e = e0;
      for (let i = 0; i < 80; i++) {
        let f, k;
        if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
        else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
        else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
        else { f = b ^ c ^ d; k = 0xca62c1d6; }
        const t = (rotate(a, 5) + f + e + k + words[i]) | 0;
        e = d; d = c; c = rotate(b, 30); b = a; a = t;
      }
      a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0; e0 = (e0 + e) | 0;
    }
    return [a0, b0, c0, d0, e0].map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }
  function objectHash(type, bytes) { return sha1(concat(utf8.encode(`${type} ${bytes.length}\0`), bytes)); }
  function compareBytes(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  }
  function validatePath(path) {
    const normalized = path.trim();
    if (!normalized || normalized.startsWith('/') || normalized.endsWith('/') || normalized.includes('\\') || /[\x00-\x1f\x7f]/.test(normalized))
      throw new Error('Podaj względną ścieżkę, np. src/notatki.txt.');
    if (normalized.split('/').some(part => !part || ['.', '..', '.git'].includes(part)))
      throw new Error('Ścieżka nie może zawierać .git, pustych segmentów, . ani ...');
    if (normalized.length > 240) throw new Error('Ścieżka może mieć najwyżej 240 znaków.');
    return normalized;
  }
  class GitRepository {
    constructor(saved) {
      this.state = saved ? copy(saved) : {
        version: 1, working: {}, directories: [], index: {}, objects: {}, branches: { main: null }, head: 'main', commits: [], events: [], tick: 0,
      };
      for (const key of ['working', 'index', 'objects', 'branches']) this.state[key] = map(this.state[key]);
    }
    get tip() { return this.state.branches[this.state.head]; }
    get snapshot() { return this.tip ? this.state.objects[this.tip].snapshot : {}; }
    export() { return copy(this.state); }
    record(command, description) {
      this.state.events.unshift({ command, description, time: Date.now() });
      this.state.events = this.state.events.slice(0, 60);
    }
    addObject(type, bytes, properties) {
      const id = objectHash(type, bytes);
      if (!own(this.state.objects, id)) this.state.objects[id] = { id, type, size: bytes.length, ...properties };
      return id;
    }
    ensureParents(path) {
      const parts = path.split('/'); parts.pop();
      for (let i = 1; i <= parts.length; i++) {
        const parent = parts.slice(0, i).join('/');
        if (!this.state.directories.includes(parent)) this.state.directories.push(parent);
      }
    }
    assertAvailable(path, isFolder) {
      if (own(this.state.working, path) || this.state.directories.includes(path) || (isFolder && own(this.state.index, path))) throw new Error('Ta ścieżka już istnieje.');
      const parts = path.split('/'); parts.pop();
      for (let i = 1; i <= parts.length; i++) if (own(this.state.working, parts.slice(0, i).join('/'))) throw new Error('Plik nie może być folderem nadrzędnym.');
      if (!isFolder && Object.keys(this.state.working).some(p => p.startsWith(path + '/'))) throw new Error('Pod tą ścieżką istnieje folder.');
    }
    createFile(input, content = '') {
      const path = validatePath(input); this.assertAvailable(path, false);
      this.state.working[path] = content; this.ensureParents(path);
      this.record(`utwórz ${path}`, 'Nowy plik jest tylko w working tree. Dodaj go do indeksu, aby go śledzić.');
      return path;
    }
    createFolder(input) {
      const path = validatePath(input); this.assertAvailable(path, true); this.ensureParents(path);
      this.state.directories.push(path);
      this.record(`mkdir ${path}`, 'Git nie zapisuje pustych folderów. Dodaj do niego plik, aby znalazł się w commicie.');
      return path;
    }
    editFile(path, content) {
      if (!own(this.state.working, path)) throw new Error('Plik już nie istnieje.');
      this.state.working[path] = content;
      this.record(`edytuj ${path}`, 'Zmienił się working tree. Wersja w indeksie i istniejące commity pozostają bez zmian.');
    }
    deletePath(path) {
      delete this.state.working[path];
      for (const p of Object.keys(this.state.working)) if (p.startsWith(path + '/')) delete this.state.working[p];
      this.state.directories = this.state.directories.filter(p => p !== path && !p.startsWith(path + '/'));
      this.record(`usuń ${path}`, 'Usunięcie jest zmianą w working tree. Dodaj je do staging area, aby zatwierdzić je w commicie.');
    }
    renamePath(from, input) {
      const to = validatePath(input), folder = this.state.directories.includes(from);
      if (!folder && !own(this.state.working, from)) throw new Error('Wybierz istniejący plik lub folder.');
      if (from === to) throw new Error('Podaj inną nazwę lub ścieżkę.');
      if (folder && to.startsWith(from + '/')) throw new Error('Folderu nie można przenieść do jego wnętrza.');
      this.assertAvailable(to, folder);
      const renamed = path => path === from ? to : path.startsWith(from + '/') ? to + path.slice(from.length) : path;
      const working = map();
      for (const [path, content] of Object.entries(this.state.working)) working[renamed(path)] = content;
      this.state.working = working;
      this.state.directories = this.state.directories.map(renamed);
      this.ensureParents(to);
      this.record(`mv ${from} ${to}`, 'Przeniesiono pliki w working tree. Indeks pozostaje bez zmian; git add zapisze nowe ścieżki. Niezmienione bloby zostaną użyte ponownie.');
      return to;
    }
    changes(left, right, valuesAreContents = false) {
      const paths = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
      return paths.flatMap(path => {
        const l = left[path], r = right[path];
        const rightId = valuesAreContents && own(right, path) ? objectHash('blob', utf8.encode(r)) : r;
        if (l === rightId) return [];
        return [{ path, status: l === undefined ? 'A' : rightId === undefined ? 'D' : 'M', before: l, after: rightId }];
      });
    }
    unstaged() { return this.changes(this.state.index, this.state.working, true); }
    staged() { return this.changes(this.snapshot, this.state.index); }
    stage(path) {
      if (own(this.state.working, path)) {
        for (const indexed of Object.keys(this.state.index)) if (indexed.startsWith(path + '/') || path.startsWith(indexed + '/')) delete this.state.index[indexed];
        this.state.index[path] = this.addObject('blob', utf8.encode(this.state.working[path]), { content: this.state.working[path] });
      } else delete this.state.index[path];
      this.record(`git add -- ${path}`, 'Indeks wskazuje na blob zapisanej teraz wersji. Blob powstał już w .git/objects, przed commitem.');
    }
    stageAll() {
      for (const change of this.unstaged()) this.stage(change.path);
      this.record('git add -A', 'Wszystkie zapisane zmiany, także usunięcia, trafiły do indeksu. Commit użyje dokładnie tych wersji.');
    }
    unstage(path) {
      if (own(this.snapshot, path)) {
        for (const indexed of Object.keys(this.state.index)) if (indexed.startsWith(path + '/') || path.startsWith(indexed + '/')) delete this.state.index[indexed];
        this.state.index[path] = this.snapshot[path];
      }
      else delete this.state.index[path];
      this.record(`git restore --staged -- ${path}`, 'Indeks wrócił do wersji z HEAD. Working tree i zapisane bloby pozostają bez zmian.');
    }
    writeTree() {
      const rootTree = { children: new Map() };
      for (const [path, id] of Object.entries(this.state.index)) {
        const parts = path.split('/'); let directory = rootTree;
        parts.forEach((name, i) => {
          if (i === parts.length - 1) directory.children.set(name, { type: 'blob', id });
          else {
            if (!directory.children.has(name)) directory.children.set(name, { children: new Map() });
            directory = directory.children.get(name);
          }
        });
      }
      const write = directory => {
        const entries = [...directory.children].map(([name, item]) => item.type === 'blob'
          ? { name, type: 'blob', mode: '100644', id: item.id }
          : { name, type: 'tree', mode: '40000', id: write(item) });
        entries.sort((a, b) => compareBytes(utf8.encode(a.name + (a.type === 'tree' ? '/' : '')), utf8.encode(b.name + (b.type === 'tree' ? '/' : ''))));
        const parts = entries.map(entry => concat(utf8.encode(`${entry.mode} ${entry.name}\0`), Uint8Array.from(entry.id.match(/../g), hex => parseInt(hex, 16))));
        return this.addObject('tree', concat(...parts), { entries });
      };
      return write(rootTree);
    }
    commit(message, timestamp) {
      const text = message.trim();
      if (!text) throw new Error('Napisz krótką wiadomość commita.');
      if (!this.staged().length) throw new Error('Najpierw dodaj zmiany do staging area.');
      const tree = this.writeTree(), parent = this.tip;
      const time = timestamp ?? Math.floor(Date.now() / 1000) + this.state.tick++;
      const identity = `Uczeń Git <uczen@example.test> ${time} +0000`;
      const raw = `tree ${tree}\n${parent ? `parent ${parent}\n` : ''}author ${identity}\ncommitter ${identity}\n\n${text}\n`;
      const id = this.addObject('commit', utf8.encode(raw), { tree, parent, message: text, time, raw, snapshot: copy(this.state.index) });
      this.state.commits.unshift(id); this.state.branches[this.state.head] = id;
      this.record(`git commit -m ${JSON.stringify(text)}`, `Powstał commit ${id.slice(0, 7)}. Gałąź ${this.state.head} wskazuje teraz na niego. Poprzednie obiekty pozostają w bazie.`);
      return id;
    }
    createBranch(name) {
      const branch = name.trim();
      if (!branch || /[\s~^:?*\[\\\x00-\x1f\x7f]/.test(branch) || branch.includes('..') || branch.includes('@{') || branch === '@' || branch.startsWith('-') || branch.split('/').some(s => !s || s.startsWith('.') || s.endsWith('.') || s.endsWith('.lock')))
        throw new Error('Podaj nazwę gałęzi, np. eksperyment lub feature/menu.');
      if (own(this.state.branches, branch) || Object.keys(this.state.branches).some(b => b.startsWith(branch + '/') || branch.startsWith(b + '/'))) throw new Error('Taka gałąź lub kolidująca ścieżka już istnieje.');
      if (!this.tip) throw new Error('Utwórz pierwszy commit przed dodaniem gałęzi.');
      this.state.branches[branch] = this.tip;
      this.record(`git branch ${branch}`, 'Nowa gałąź to kolejny wskaźnik na istniejący commit. Nie kopiuje obiektów.');
      return branch;
    }
    switchBranch(branch) {
      if (!own(this.state.branches, branch)) throw new Error('Nie ma takiej gałęzi.');
      if (branch === this.state.head) return;
      if (this.staged().length || this.unstaged().length) throw new Error('W tym symulatorze zatwierdź zmiany przed przełączeniem gałęzi.');
      this.state.head = branch;
      const snapshot = this.snapshot;
      this.state.index = map(snapshot); this.state.working = map(); this.state.directories = [];
      for (const [path, id] of Object.entries(snapshot)) { this.state.working[path] = this.state.objects[id].content; this.ensureParents(path); }
      this.record(`git switch ${branch}`, `HEAD wskazuje teraz na ${branch}. Working tree i indeks odtworzono z jej ostatniego commita.`);
    }
    static example(committed = true) {
      const repo = new GitRepository();
      repo.createFile('README.md', '# Mój projekt\n\nTutaj zaczyna się nasza przygoda z Git.\n');
      repo.createFile('src/index.js', 'function powitanie(imie) {\n  return `Cześć, ${imie}!`;\n}\n\nconsole.log(powitanie("Git"));\n');
      repo.createFile('src/styles.css', 'body {\n  font-family: sans-serif;\n  background: #ffffff;\n}\n');
      if (committed) { repo.stageAll(); repo.commit('Pierwszy commit', 1791280800); }
      repo.state.events = [{ command: committed ? 'git log --oneline' : 'git init', description: committed ? 'Repozytorium ma pierwszy commit. Edytuj plik i sprawdź, jak zmieni się graf.' : 'Repozytorium jest gotowe. Trzy przykładowe pliki czekają na pierwszy git add.', time: Date.now() }];
      return repo;
    }
  }
  const api = { GitRepository, objectHash, sha1, validatePath };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GitEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
