(function () {
  'use strict';
  const { GitRepository } = GitEngine;
  const { t, plural } = GitI18n;
  const $ = selector => document.querySelector(selector);
  const storageKey = 'git-od-srodka:v1';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const paths = {
    branch:'M6 6v12m0-6h6a6 6 0 0 0 6-6 M9 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M9 21a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 3a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    folder:'M3 7h6l2 2h10v11H3z M3 7V4h6l2 3h10v2', file:'M6 3h8l4 4v14H6z M14 3v5h4',
    book:'M12 5v16 M12 5C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 1',
    reset:'M3 10a9 9 0 0 1 15-6l3 3 M21 3v4h-4 M21 14a9 9 0 0 1-15 6l-3-3 M3 21v-4h4',
    'arrow-right':'M4 12h16 M14 6l6 6-6 6', plus:'M12 5v14 M5 12h14', minus:'M5 12h14',
    commit:'M3 12h5 M16 12h5 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    save:'M4 3h13l4 4v14H3V3z M7 3v7h10V3 M7 21v-7h10v7',
    trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    close:'M6 6l12 12 M18 6 6 18', check:'M5 12l4 4L19 6', chevron:'M6 9l6 6 6-6',
    undo:'M8 4 3 9l5 5 M3 9h10a7 7 0 0 1 0 14', list:'M8 6h13 M8 12h13 M8 18h13 M3 6h1 M3 12h1 M3 18h1',
    maximize:'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5', terminal:'M4 7l5 5-5 5 M12 17h8',
    index:'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5', tree:'M12 3v7 M5 10h14 M5 10v7 M19 10v7 M2 17h6v5H2z M16 17h6v5h-6',
    edit:'M14 5l5 5 M4 16 16 4a2 2 0 0 1 4 4L8 20H4z',
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const applyStaticLanguage = GitI18n.bindStatic(document);
  applyStaticLanguage();
  let repo, selectedPath = 'src/index.js', selectedNode, toastTimer, mode = 'objects', dirty = false;
  let undoStack = [], collapsed = new Set(), storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    repo = saved?.version === 1 && saved.objects && saved.working && saved.branches && saved.index && saved.commits && saved.events ? new GitRepository(saved) : GitRepository.example();
  } catch { repo = GitRepository.example(); }
  if (!(selectedPath in repo.state.working)) selectedPath = Object.keys(repo.state.working)[0] || null;
  selectedNode = selectedPath && repo.state.index[selectedPath] || repo.tip || 'HEAD';
  const graph = new GitGraph($('#git-graph'), $('#graph-viewport'), selectObject);
  function notify(message, error = false) {
    clearTimeout(toastTimer); $('#toast').textContent = t(message); $('#toast').classList.toggle('error', error); $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4200);
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(repo.export())); }
    catch { if (storageAvailable) notify('Przeglądarka nie zapisała sesji. Możesz dalej pracować w tej karcie.'); storageAvailable = false; }
  }
  function pulse(selector) {
    const el = $(selector); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  }
  function mutate(operation, options = {}) {
    const before = repo.export();
    try {
      const result = operation();
      undoStack.push({ state: before, selectedPath }); if (undoStack.length > 30) undoStack.shift();
      if (options.selectResult) selectedPath = result;
      dirty = false; persist(); render();
      if (options.pulse) pulse(options.pulse);
      if (options.message) notify(options.message);
      return result ?? true;
    } catch (error) { repo = new GitRepository(before); notify(error.message, true); return false; }
  }
  const badge = status => `<span class="status-badge status-${status === 'U' ? 'A' : status}" title="${t({ U: 'Nieśledzony plik', A: 'Dodany', M: 'Zmieniony', D: 'Usunięty' }[status])}">${status === 'U' ? '?' : status}</span>`;
  function changeRow(change, staged) {
    return `<div class="change-row">${badge(!staged && change.status === 'A' ? 'U' : change.status)}<button class="path-button" data-${staged ? 'staged' : 'open'}="${escape(change.path)}" title="${escape(change.path)}">${escape(change.path)}</button><button class="icon-button" data-${staged ? 'unstage' : 'stage'}="${escape(change.path)}" aria-label="${t(staged ? 'Wycofaj ze staging area' : 'Dodaj do staging area')}: ${escape(change.path)}" title="${t(staged ? 'Wycofaj ze staging area' : 'git add')}">${icon(staged ? 'undo' : 'plus')}</button></div>`;
  }
  function renderPipeline() {
    const unstaged = repo.unstaged(), staged = repo.staged();
    $('#working-count').textContent = `${plural(Object.keys(repo.state.working).length, ['plik', 'pliki', 'plików'])} · ${plural(unstaged.length, ['zmiana', 'zmiany', 'zmian'])}`;
    $('#staged-count').textContent = plural(staged.length, ['zmiana', 'zmiany', 'zmian']);
    $('#commit-count').textContent = plural(repo.state.commits.length, ['commit', 'commity', 'commitów']);
    $('#working-changes').innerHTML = unstaged.length ? unstaged.map(c => changeRow(c, false)).join('') : `<div class="empty-stage">${icon('check')}Working tree bez zmian</div>`;
    $('#staged-changes').innerHTML = staged.length ? staged.map(c => changeRow(c, true)).join('') : `<div class="empty-stage">${icon('index')}Brak zmian do zatwierdzenia</div>`;
    $('#working-hint').textContent = 'Zapisz → dodaj → zatwierdź';
    $('#stage-all').disabled = !unstaged.length; $('#commit-button').disabled = !staged.length;
    const commit = repo.tip && repo.state.objects[repo.tip];
    $('#latest-commit').innerHTML = commit ? `<button class="latest-commit" data-object="${repo.tip}"><code>${repo.tip.slice(0, 7)}</code><div><div class="latest-message">${escape(commit.message)}</div><span class="muted">${plural(Object.keys(commit.snapshot).length, ['plik', 'pliki', 'plików'])} ${t('w migawce')}</span></div><span class="branch-tag">${escape(repo.state.head)}</span></button>` : `<div class="empty-stage">${icon('commit')}Czeka na pierwszy commit</div>`;
    const objects = Object.values(repo.state.objects);
    $('#object-count').textContent = `${plural(objects.length, ['obiekt', 'obiekty', 'obiektów'])} · ${plural(objects.filter(o => o.type === 'blob').length, ['blob', 'bloby', 'blobów'])}`;
    GitI18n.translateUI($('#working-stage')); GitI18n.translateUI($('#index-stage')); GitI18n.translateUI($('#repository-stage'));
  }
  function renderFiles() {
    const unstaged = new Map(repo.unstaged().map(c => [c.path, c.status === 'A' ? 'U' : c.status])), staged = new Map(repo.staged().map(c => [c.path, c.status]));
    const tree = { children: new Map() };
    const insert = (path, folder) => {
      let parent = tree; const segments = path.split('/');
      segments.forEach((name, index) => {
        const fullPath = segments.slice(0, index + 1).join('/');
        if (!parent.children.has(name)) parent.children.set(name, { name, path: fullPath, folder: folder || index < segments.length - 1, children: new Map() });
        parent = parent.children.get(name);
      });
    };
    repo.state.directories.forEach(p => insert(p, true));
    [...new Set([...Object.keys(repo.state.working), ...Object.keys(repo.state.index)])].forEach(p => insert(p, false));
    const rows = [];
    const visit = (parent, level = 0) => {
      const entries = [...parent.children.values()].sort((a, b) => a.folder === b.folder ? a.name.localeCompare(b.name) : a.folder ? -1 : 1);
      for (const entry of entries) {
        const deleted = !entry.folder && !Object.prototype.hasOwnProperty.call(repo.state.working, entry.path);
        rows.push(`<button class="file-row ${entry.folder ? 'folder' : ''} ${selectedPath === entry.path ? 'selected' : ''} ${deleted ? 'deleted' : ''}" style="padding-left:${8 + level * 19}px" data-open="${escape(entry.path)}" data-folder="${entry.folder}" aria-label="${t(entry.folder ? 'Folder' : 'Plik')} ${escape(entry.path)}${deleted ? ', ' + t('usunięty') : ''}" ${entry.folder ? `aria-expanded="${!collapsed.has(entry.path)}"` : `aria-pressed="${selectedPath === entry.path}"`}>${entry.folder ? `<span class="chevron ${collapsed.has(entry.path) ? 'closed' : ''}">${icon('chevron')}</span>` : '<span style="width:12px;flex-shrink:0"></span>'}${icon(entry.folder ? 'folder' : 'file')}<span class="file-name">${escape(entry.name)}${entry.folder ? '/' : ''}</span><span class="file-status">${staged.has(entry.path) ? `<span title="Zmiana w staging area" style="color:var(--teal)">${icon('check')}</span>` : ''}${unstaged.has(entry.path) ? badge(unstaged.get(entry.path)) : ''}</span></button>`);
        if (entry.folder && !collapsed.has(entry.path)) visit(entry, level + 1);
      }
    };
    visit(tree); $('#file-tree').innerHTML = rows.join('') || '<div class="empty-stage">Dodaj pierwszy plik</div>';
    $('#folder-tip').hidden = !repo.state.directories.some(d => !Object.keys(repo.state.working).some(p => p.startsWith(d + '/')));
    GitI18n.translateUI($('#file-tree'));
  }
  function updateLineNumbers() { $('#line-numbers').textContent = Array.from({ length: $('#file-content').value.split('\n').length }, (_, i) => i + 1).join('\n'); }
  function renderEditor() {
    const exists = selectedPath && Object.prototype.hasOwnProperty.call(repo.state.working, selectedPath);
    const folder = selectedPath && repo.state.directories.includes(selectedPath);
    $('#editor-title').innerHTML = `<span class="purple">${icon(folder ? 'folder' : 'file')}</span><span class="title-text">${escape(selectedPath ? selectedPath.split('/').pop() + (folder ? '/' : '') : t('Wybierz plik'))}</span>`;
    $('#file-content').disabled = !exists;
    $('#file-content').value = exists ? repo.state.working[selectedPath] : folder ? t('To jest folder.\n\nDodaj plik, podając ścieżkę:\n') + selectedPath + '/' + t('nowy-plik.txt') + t('\n\nPusty folder nie jest zapisywany w Git.') : selectedPath ? t('Plik został usunięty z working tree.\nDodaj usunięcie do staging area, aby je zatwierdzić.') : t('Wybierz plik w drzewie po lewej\nlub utwórz nowy plik.');
    $('#editor-status').textContent = folder ? 'folder' : exists ? t('zapisano') : '';
    $('#save-file').disabled = true; $('#delete-path').disabled = !exists && !folder;
    $('#rename-path').disabled = !exists && !folder;
    $('#save-hint').textContent = 'Ctrl / ⌘ + S'; updateLineNumbers(); dirty = false;
  }
  function objectLink(id, label) { return `<button class="object-link" data-object="${escape(id)}">${escape(label || id.slice(0, 7))}</button>`; }
  function renderInspector() {
    const node = graph.nodes.get(selectedNode), object = repo.state.objects[selectedNode];
    const title = $('#inspector-title'), content = $('#inspector-content'), meta = $('#inspector-meta');
    if (selectedNode === 'HEAD') {
      title.innerHTML = `<span class="purple">${icon('branch')}</span>HEAD · gdzie jesteś teraz`; meta.textContent = '.git/HEAD';
      content.innerHTML = `<p class="muted">HEAD to symboliczny wskaźnik na aktualną gałąź. Gdy tworzysz commit, przesuwa się wskazywana gałąź, a HEAD nadal odnosi się do niej.</p><pre>ref: refs/heads/${escape(repo.state.head)}</pre><div class="object-path">Wskazuje na ${objectLink('ref:' + repo.state.head, repo.state.head)}</div>`;
    } else if (selectedNode?.startsWith('ref:')) {
      const name = selectedNode.slice(4), id = repo.state.branches[name];
      title.innerHTML = `<span class="purple">${icon('branch')}</span>Branch · ${escape(name)}`; meta.textContent = '.git/refs/heads/' + name;
      content.innerHTML = `<p class="muted">Gałąź przechowuje identyfikator ostatniego commita. To mały wskaźnik — nie osobna kopia plików.</p>${id ? `<div class="detail-row"><span>Commit</span>${objectLink(id)}</div><pre>${id}</pre>` : '<p class="muted">Ta gałąź jeszcze nie ma commita. Jej plik refs/heads powstanie przy pierwszym commicie.</p>'}`;
    } else if (selectedNode === 'INDEX') {
      title.innerHTML = `${icon('index')}Index · plan następnego commita`; meta.textContent = '.git/index';
      content.innerHTML = `<p class="muted">Indeks zawiera całą planowaną migawkę, także niezmienione pliki. Lista staging area pokazuje tylko różnice względem HEAD.</p><table class="tree-table"><thead><tr><th>Ścieżka</th><th>Blob</th></tr></thead><tbody>${Object.entries(repo.state.index).map(([path, id]) => `<tr><td class="mono">${escape(path)}</td><td>${objectLink(id)}</td></tr>`).join('')}</tbody></table>`;
    } else if (object) {
      const type = object.type, name = node?.label || (type === 'commit' ? object.message : type);
      title.innerHTML = `<span style="color:var(--${type === 'tree' ? 'amber' : type === 'blob' ? 'teal' : 'purple'})">${icon(type === 'commit' ? 'commit' : type === 'tree' ? 'folder' : 'file')}</span><span class="title-text">${type[0].toUpperCase() + type.slice(1)} · ${escape(name)}</span>`;
      meta.textContent = `${object.id.slice(0, 12)} · ${object.size} B`;
      if (type === 'blob') {
        content.innerHTML = `<p class="muted">Zapisana treść pliku. Blob nie zawiera nazwy ani ścieżki — te przechowuje nadrzędny tree.</p><pre>${escape(object.content || t('(pusty plik)'))}</pre>`;
      } else if (type === 'tree') {
        content.innerHTML = `<p class="muted">Tree łączy nazwy, tryby i wskaźniki na bloby oraz podfoldery.</p><table class="tree-table"><thead><tr><th>Tryb</th><th>Nazwa</th><th>Typ</th><th>Obiekt</th></tr></thead><tbody>${object.entries.map(e => `<tr><td class="mono">${e.mode}</td><td class="mono">${escape(e.name)}${e.type === 'tree' ? '/' : ''}</td><td>${e.type}</td><td>${objectLink(e.id)}</td></tr>`).join('')}</tbody></table>`;
      } else {
        content.innerHTML = `<p class="muted">Commit wskazuje na główny tree oraz poprzedni commit. Jest niezmienną migawką całego indeksu.</p><div class="detail-row"><span>Wiadomość</span><strong data-user-text>${escape(object.message)}</strong></div><div class="detail-row"><span>Główny tree</span>${objectLink(object.tree)}</div><div class="detail-row"><span>Parent</span>${object.parent ? objectLink(object.parent) : '<span>Pierwszy commit — brak rodzica</span>'}</div><div class="detail-row"><span>Pliki</span><span>${Object.keys(object.snapshot).length} ${t('w migawce')}</span></div>`;
      }
      content.innerHTML += `<div class="object-path">.git/objects/${object.id.slice(0, 2)}/${object.id.slice(2)}</div>`;
    } else {
      title.textContent = 'Wybierz obiekt na grafie'; meta.textContent = '';
      content.innerHTML = '<p class="muted">Kliknij HEAD, gałąź, commit, tree lub blob, aby sprawdzić jego zawartość i wskaźniki.</p>';
    }
    GitI18n.translateUI(title); GitI18n.translateUI(content);
  }
  function selectObject(id) { selectedNode = id; graph.select(id); renderInspector(); }
  function render() {
    renderPipeline(); renderFiles(); renderEditor();
    $('#branch-select').innerHTML = Object.keys(repo.state.branches).map(name => `<option value="${escape(name)}" ${name === repo.state.head ? 'selected' : ''}>${escape(name)}</option>`).join('');
    graph.render(repo, selectedNode, mode); renderInspector();
    const event = repo.state.events[0]; $('#last-command').textContent = GitI18n.command(event?.command || 'git init'); $('#last-description').textContent = t(event?.description || ''); $('#last-description').title = t(event?.description || '');
    $('#graph-caption').textContent = t(mode === 'objects' ? 'Kliknij obiekt, aby zajrzeć do środka' : 'Strzałka parent prowadzi do wcześniejszego commita');
    $('#undo-button').disabled = !undoStack.length;
  }
  function showDialog(title, html) {
    $('#dialog-title').textContent = t(title); $('#dialog-content').innerHTML = html;
    GitI18n.translateUI($('#dialog-content'));
    if (!$('#app-dialog').open) $('#app-dialog').showModal();
  }
  const closeDialog = () => $('#app-dialog').close();
  function withSavedDraft(action) {
    if (!dirty) { action(); return; }
    showDialog('Masz niezapisane zmiany', '<p class="dialog-copy">Zapisz zawartość edytora do working tree albo odrzuć bieżącą edycję.</p><div class="dialog-actions"><button class="button secondary" id="discard-draft">Odrzuć edycję</button><button class="button primary" id="save-draft">Zapisz i kontynuuj</button></div>');
    $('#discard-draft').onclick = () => { dirty = false; closeDialog(); action(); };
    $('#save-draft').onclick = () => { saveFile(); closeDialog(); action(); };
  }
  function openPath(path, isFolder = false) {
    withSavedDraft(() => {
      if (isFolder && selectedPath === path) collapsed.has(path) ? collapsed.delete(path) : collapsed.add(path);
      selectedPath = path; renderFiles(); renderEditor();
    });
  }
  function saveFile() {
    if (!dirty || !selectedPath) return;
    const content = $('#file-content').value;
    mutate(() => repo.editFile(selectedPath, content), { pulse: '#working-stage', message: 'Zapisano w working tree. Teraz możesz wykonać git add.' });
  }
  function createPath(folder) {
    withSavedDraft(() => {
      const prefix = selectedPath && repo.state.directories.includes(selectedPath) ? selectedPath + '/' : '';
      showDialog(folder ? 'Nowy folder' : 'Nowy plik', `<p class="dialog-copy">${folder ? 'Puste foldery pozostają w working tree. Git zapisze folder dopiero wtedy, gdy dodasz jego pliki.' : 'Podaj nazwę lub ścieżkę względną. Foldery nadrzędne utworzą się automatycznie.'}</p><form id="path-form" class="dialog-form"><label for="new-path">${folder ? 'Ścieżka folderu' : 'Ścieżka pliku'}</label><input id="new-path" value="${escape(prefix)}" placeholder="${folder ? 'src/components' : 'src/notatki.txt'}" maxlength="240" required autocomplete="off"><p id="path-error" class="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button secondary" id="cancel-path">Anuluj</button><button class="button primary" type="submit">Utwórz ${folder ? 'folder' : 'plik'}</button></div></form>`);
      $('#cancel-path').onclick = closeDialog;
      $('#path-form').onsubmit = event => {
        event.preventDefault(); const before = repo.export();
        try {
          const result = folder ? repo.createFolder($('#new-path').value) : repo.createFile($('#new-path').value);
          undoStack.push({ state: before, selectedPath }); selectedPath = result; collapsed.clear(); closeDialog(); persist(); render(); pulse('#working-stage');
        } catch (error) { repo = new GitRepository(before); $('#path-error').textContent = t(error.message); }
      };
      $('#new-path').focus();
    });
  }
  $('#file-content').addEventListener('input', () => {
    dirty = $('#file-content').value !== repo.state.working[selectedPath];
    $('#save-file').disabled = !dirty; $('#editor-status').innerHTML = dirty ? `<span class="dirty-dot"></span> ${t('niezapisano')}` : t('zapisano'); updateLineNumbers();
  });
  $('#file-content').addEventListener('scroll', () => { $('#line-numbers').scrollTop = $('#file-content').scrollTop; });
  $('#file-content').addEventListener('keydown', event => {
    if (event.key === 'Tab') { event.preventDefault(); const input = event.target, start = input.selectionStart; input.setRangeText('  ', start, input.selectionEnd, 'end'); input.dispatchEvent(new Event('input')); }
  });
  document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveFile(); } });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  $('#save-file').onclick = saveFile;
  $('#new-file').onclick = () => createPath(false); $('#new-folder').onclick = () => createPath(true);
  $('#rename-path').onclick = () => withSavedDraft(() => {
    const from = selectedPath;
    showDialog('Zmień nazwę lub ścieżkę', `<p class="dialog-copy">Przenieś <strong data-user-text>${escape(from)}</strong> w working tree. Dodaj potem zmiany do indeksu, aby zapisać nowe ścieżki w commicie.</p><form id="rename-form" class="dialog-form"><label for="rename-input">Nowa ścieżka</label><input id="rename-input" value="${escape(from)}" required maxlength="240" autocomplete="off"><p id="rename-error" class="form-error" role="alert"></p><div class="dialog-actions"><button type="button" id="cancel-rename" class="button secondary">Anuluj</button><button class="button primary" type="submit">Zmień</button></div></form>`);
    $('#cancel-rename').onclick = closeDialog;
    $('#rename-form').onsubmit = event => {
      event.preventDefault(); const before = repo.export();
      try { const result = repo.renamePath(from, $('#rename-input').value); undoStack.push({ state: before, selectedPath }); selectedPath = result; collapsed.clear(); closeDialog(); persist(); render(); pulse('#working-stage'); }
      catch (error) { repo = new GitRepository(before); $('#rename-error').textContent = t(error.message); }
    };
    $('#rename-input').focus(); $('#rename-input').select();
  });
  $('#stage-all').onclick = () => withSavedDraft(() => mutate(() => repo.stageAll(), { pulse: '#index-stage', message: 'Zapisane wersje trafiły do staging area.' }));
  $('#commit-form').onsubmit = event => {
    event.preventDefault();
    // Only index contents are committed. An unsaved editor draft is retained.
    const draft = dirty ? $('#file-content').value : null;
    const result = mutate(() => repo.commit($('#commit-message').value), { pulse: '#repository-stage' });
    if (result) { $('#commit-message').value = ''; selectObject(result); notify('Commit utworzony. Gałąź wskazuje na nową migawkę.'); }
    if (draft !== null) { $('#file-content').value = draft; $('#file-content').dispatchEvent(new Event('input')); }
  };
  document.addEventListener('click', event => {
    const stage = event.target.closest('[data-stage]'), unstage = event.target.closest('[data-unstage]'), open = event.target.closest('[data-open]'), staged = event.target.closest('[data-staged]'), object = event.target.closest('[data-object]');
    if (stage) withSavedDraft(() => mutate(() => repo.stage(stage.dataset.stage), { pulse: '#index-stage' }));
    else if (unstage) withSavedDraft(() => mutate(() => repo.unstage(unstage.dataset.unstage), { pulse: '#index-stage' }));
    else if (open) openPath(open.dataset.open, open.dataset.folder === 'true');
    else if (staged) {
      const id = repo.state.index[staged.dataset.staged];
      if (id) selectObject(id); else { selectObject('INDEX'); notify('Usunięcie to brak ścieżki w indeksie. Poprzedni blob zostaje w .git.'); }
    } else if (object) selectObject(object.dataset.object);
  });
  $('#delete-path').onclick = () => withSavedDraft(() => {
    const path = selectedPath;
    showDialog('Usuń z working tree', `<p class="dialog-copy">Usunąć <strong data-user-text>${escape(path)}</strong>${repo.state.directories.includes(path) ? ' wraz z zawartością' : ''}? Istniejące commity zachowają zapisane wersje. Operację możesz cofnąć.</p><div class="dialog-actions"><button id="cancel-delete" class="button secondary">Anuluj</button><button id="confirm-delete" class="button danger">Usuń</button></div>`);
    $('#cancel-delete').onclick = closeDialog; $('#confirm-delete').onclick = () => { closeDialog(); mutate(() => repo.deletePath(path), { pulse: '#working-stage' }); };
  });
  $('#branch-select').onchange = event => {
    const branch = event.target.value;
    withSavedDraft(() => { mutate(() => repo.switchBranch(branch)); $('#branch-select').value = repo.state.head; });
    $('#branch-select').value = repo.state.head;
  };
  $('#new-branch').onclick = () => {
    showDialog('Utwórz gałąź', '<p class="dialog-copy">Nowa gałąź będzie wskazywać na bieżący commit. Możesz ją potem wybrać nad grafem.</p><form id="branch-form" class="dialog-form"><label for="branch-name">Nazwa gałęzi</label><input id="branch-name" placeholder="eksperyment" required maxlength="80" autocomplete="off"><p id="branch-error" class="form-error" role="alert"></p><div class="dialog-actions"><button type="button" id="cancel-branch" class="button secondary">Anuluj</button><button class="button primary" type="submit">Utwórz gałąź</button></div></form>');
    $('#cancel-branch').onclick = closeDialog;
    $('#branch-form').onsubmit = event => {
      event.preventDefault(); const before = repo.export();
      try { const name = repo.createBranch($('#branch-name').value); undoStack.push({ state: before, selectedPath }); closeDialog(); persist(); renderPipeline(); $('#branch-select').innerHTML = Object.keys(repo.state.branches).map(b => `<option value="${escape(b)}" ${b === repo.state.head ? 'selected' : ''}>${escape(b)}</option>`).join(''); graph.render(repo, selectedNode, mode); $('#undo-button').disabled = false; $('#last-command').textContent = GitI18n.command(repo.state.events[0].command); $('#last-description').textContent = t(repo.state.events[0].description); notify(`Utworzono gałąź ${name}. Wybierz ją nad grafem.`); }
      catch (error) { repo = new GitRepository(before); $('#branch-error').textContent = t(error.message); }
    };
    $('#branch-name').focus();
  };
  function switchView(next) {
    mode = next; $('#objects-tab').setAttribute('aria-selected', String(next === 'objects')); $('#history-tab').setAttribute('aria-selected', String(next === 'history'));
    graph.render(repo, selectedNode, mode); graph.fit(); renderInspector();
    $('#graph-caption').textContent = t(next === 'objects' ? 'Kliknij obiekt, aby zajrzeć do środka' : 'Strzałka parent prowadzi do wcześniejszego commita');
  }
  $('#objects-tab').onclick = () => switchView('objects'); $('#history-tab').onclick = () => switchView('history');
  $('#zoom-in').onclick = () => graph.setZoom(graph.zoom * 1.2); $('#zoom-out').onclick = () => graph.setZoom(graph.zoom / 1.2); $('#zoom-fit').onclick = () => graph.fit();
  $('#undo-button').onclick = () => withSavedDraft(() => {
    const previous = undoStack.pop(); if (!previous) return;
    repo = new GitRepository(previous.state); selectedPath = previous.selectedPath; selectedNode = repo.tip || 'HEAD'; persist(); render(); notify('Cofnięto ostatnią operację symulatora.');
  });
  $('#reset-button').onclick = () => {
    showDialog('Zacznij od nowa', '<p class="dialog-copy">Wybierz punkt startowy. Bieżącą sesję zastąpi nowe repozytorium; możesz wrócić do niej przyciskiem „Cofnij”.</p><div class="reset-options"><button id="reset-empty"><strong>Od git init</strong><span>Brak commitów. Trzy przykładowe pliki czekają na git add.</span></button><button id="reset-example"><strong>Z pierwszym commitem</strong><span>Gotowy graf. Edytuj pliki i obserwuj kolejne migawki.</span></button></div>');
    const reset = committed => { closeDialog(); const before = repo.export(); undoStack.push({ state: before, selectedPath }); repo = GitRepository.example(committed); selectedPath = 'src/index.js'; selectedNode = repo.tip || 'HEAD'; dirty = false; collapsed.clear(); $('#commit-message').value = ''; mode = 'objects'; $('#objects-tab').setAttribute('aria-selected', 'true'); $('#history-tab').setAttribute('aria-selected', 'false'); persist(); render(); graph.fit(); };
    $('#reset-empty').onclick = () => reset(false); $('#reset-example').onclick = () => reset(true);
  };
  $('#help-button').onclick = () => showDialog('Git, krok po kroku', `<div class="help-list">${[
    ['Edytuj w working tree', 'Wybierz plik, zmień treść i kliknij „Zapisz zmiany”. To Twoje zwykłe pliki projektu.'],
    ['Dodaj wersję do indeksu', '<code>git add</code> zapisuje blob w <code>.git/objects</code> i aktualizuje <code>.git/index</code>. Kolejna edycja pliku nie zmienia już tej wersji.'],
    ['Utwórz commit', 'Wpisz wiadomość i kliknij „Commit”. Git buduje drzewa z całego indeksu i zapisuje commit wskazujący na główny tree oraz rodzica.'],
    ['Podążaj za wskaźnikami', '<code>HEAD → branch → commit → tree → blob</code>. Klikaj węzły, aby zobaczyć ich treść. Gałąź przesuwa się do nowego commita, a stare obiekty zostają.'],
    ['Sprawdź, co się powtarza', 'Te same treści mają ten sam hash. Niezmienione bloby i drzewa są współdzielone. Git nie zapisuje pustych folderów ani nazw plików w blobach.'],
    ['Eksperymentuj z gałęziami', 'Przycisk „+” nad grafem tworzy gałąź. W tym symulatorze zatwierdź wszystkie zmiany przed przełączeniem. Sesja zapisuje się lokalnie w przeglądarce.'],
  ].map(([title, description], i) => `<div class="help-item"><span class="step-number">${String(i + 1).padStart(2, '0')}</span><div><h3>${t(title)}</h3><p>${t(description)}</p></div></div>`).join('')}</div><a class="help-link" href="https://git-scm.com/book/en/v2/Git-Internals-Git-Objects" target="_blank" rel="noopener noreferrer">Więcej: oficjalna książka Pro Git ↗</a><p class="dialog-copy" style="margin:12px 0 0">To symulator w pamięci przeglądarki. Nie zmienia plików ani repozytoriów na Twoim dysku. Hashowanie blobów, drzew i commitów odpowiada formatowi Git SHA-1; pomijamy kompresję, packfile, merge i zdalne repozytoria.</p>`);
  $('#activity-button').onclick = () => showDialog('Dziennik operacji', `<div class="event-list">${repo.state.events.map(event => `<article><time>${new Date(event.time).toLocaleTimeString(GitI18n.locale, { hour: '2-digit', minute: '2-digit' })}</time><code>${escape(GitI18n.command(event.command))}</code><p>${escape(t(event.description))}</p></article>`).join('')}</div>`);
  $('#close-dialog').onclick = closeDialog;
  document.querySelectorAll('[data-language]').forEach(button => {
    button.onclick = () => {
      if (button.dataset.language === GitI18n.language) return;
      const input = $('#file-content');
      const draft = dirty ? { value: input.value, start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection, top: input.scrollTop, left: input.scrollLeft } : null;
      GitI18n.setLanguage(button.dataset.language);
      applyStaticLanguage(); render();
      if (draft) {
        input.value = draft.value; input.dispatchEvent(new Event('input'));
        input.setSelectionRange(draft.start, draft.end, draft.direction); input.scrollTop = draft.top; input.scrollLeft = draft.left;
      }
      $('#toast').hidden = true; clearTimeout(toastTimer);
    };
  });
  $('#app-dialog').addEventListener('click', event => { if (event.target === $('#app-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
  render(); persist();
})();
