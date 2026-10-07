/* UI-only translations. Repository contents, paths and commit messages stay intact. */
(function (root) {
  'use strict';
  const storageKey = 'git-od-srodka:language';
  let language = 'pl';
  try { if (root.localStorage?.getItem(storageKey) === 'en') language = 'en'; } catch { /* Storage is optional. */ }
  const english = {
    'Git / od środka — interaktywne laboratorium': 'Git / inside out — interactive lab',
    'Git od środka — strona główna': 'Git inside out — home',
    '/ od środka': '/ inside out',
    'Pomoc i ustawienia': 'Help and settings',
    'Język interfejsu': 'Interface language',
    'Polski': 'Polish',
    'Angielski': 'English',
    'Jak to działa?': 'How does it work?',
    'Zacznij od nowa': 'Start over',
    'Zobacz, co dzieje się w Git.': 'See what happens inside Git.',
    'Edytuj pliki, dodawaj je do staging area i twórz commity, aby zobaczyć, jak Git przechowuje Twoje dane.': 'Edit files, stage changes and create commits to see how Git stores your data.',
    'Przepływ zmian w Git': 'The Git workflow',
    'Tutaj edytujesz pliki w swoim projekcie.': 'This is where you edit your project files.',
    'Dodaj wszystkie': 'Stage all',
    'Wersje plików do następnego commita.': 'File versions for your next commit.',
    'Wiadomość commita': 'Commit message',
    'Wiadomość commita…': 'Commit message…',
    'Repozytorium .git': '.git repository',
    'Twój projekt zapisany jako historia commitów.': 'Your project saved as a history of commits.',
    'Pliki projektu': 'Project files',
    'Plik': 'File', 'Folder': 'Folder',
    'Drzewo plików': 'File tree',
    'Git nie śledzi pustych folderów.': 'Git does not track empty folders.',
    'Edytor pliku': 'File editor',
    'Zmień nazwę lub ścieżkę': 'Rename or move',
    'Usuń wybrany plik lub folder': 'Delete selected file or folder',
    'Zawartość pliku': 'File contents',
    'Zapisz zmiany': 'Save changes',
    'Baza danych Git': 'Git database',
    'Graf obiektów .git': '.git object graph',
    'Każdy commit to migawka Twojego projektu.': 'Every commit is a snapshot of your project.',
    'Aktualna gałąź': 'Current branch',
    'Utwórz gałąź': 'Create branch',
    'Widok grafu': 'Graph view',
    'Obiekty': 'Objects', 'Historia': 'History',
    'Kliknij obiekt, aby zajrzeć do środka': 'Click an object to look inside',
    'Strzałka parent prowadzi do wcześniejszego commita': 'A parent arrow points to an earlier commit',
    'Interaktywny graf obiektów Git': 'Interactive Git object graph',
    'HEAD, gałęzie, commity, drzewa i bloby': 'HEAD, branches, commits, trees and blobs',
    'Legenda': 'Legend', 'gałąź': 'branch', 'migawka': 'snapshot', 'treść pliku': 'file contents',
    'Pomniejsz graf': 'Zoom out', 'Powiększ graf': 'Zoom in', 'Dopasuj graf do okna': 'Fit graph to view',
    'Podgląd obiektu': 'Object inspector', 'Ostatnia operacja': 'Latest operation',
    'Cofnij': 'Undo', 'Pokaż dziennik operacji': 'Show activity log',
    'Dziennik operacji': 'Activity log', 'Zamknij okno': 'Close dialog',
    'Przeglądarka nie zapisała sesji. Możesz dalej pracować w tej karcie.': 'The browser could not save your session. You can keep working in this tab.',
    'Nieśledzony plik': 'Untracked file', 'Dodany': 'Added', 'Zmieniony': 'Modified', 'Usunięty': 'Deleted',
    'Wycofaj ze staging area': 'Unstage', 'Dodaj do staging area': 'Stage',
    'plik': 'file', 'pliki': 'files', 'plików': 'files',
    'zmiana': 'change', 'zmiany': 'changes', 'zmian': 'changes',
    'commity': 'commits', 'commitów': 'commits',
    'obiekt': 'object', 'obiekty': 'objects', 'obiektów': 'objects',
    'bloby': 'blobs', 'blobów': 'blobs', 'wpis': 'entry', 'wpisy': 'entries', 'wpisów': 'entries',
    'Working tree bez zmian': 'Working tree is clean',
    'Brak zmian do zatwierdzenia': 'No changes staged',
    'Zapisz → dodaj → zatwierdź': 'Save → stage → commit',
    'w migawce': 'in snapshot', 'Czeka na pierwszy commit': 'Waiting for the first commit',
    'usunięty': 'deleted', 'Zmiana w staging area': 'Staged change',
    'Dodaj pierwszy plik': 'Add your first file', 'Wybierz plik': 'Select a file',
    'To jest folder.\n\nDodaj plik, podając ścieżkę:\n': 'This is a folder.\n\nAdd a file using the path:\n',
    '\n\nPusty folder nie jest zapisywany w Git.': '\n\nEmpty folders are not stored in Git.',
    'Plik został usunięty z working tree.\nDodaj usunięcie do staging area, aby je zatwierdzić.': 'This file was deleted from the working tree.\nStage the deletion to include it in a commit.',
    'Wybierz plik w drzewie po lewej\nlub utwórz nowy plik.': 'Select a file in the tree on the left\nor create a new file.',
    'zapisano': 'saved', 'niezapisano': 'unsaved',
    'HEAD · gdzie jesteś teraz': 'HEAD · your current position',
    'HEAD to symboliczny wskaźnik na aktualną gałąź. Gdy tworzysz commit, przesuwa się wskazywana gałąź, a HEAD nadal odnosi się do niej.': 'HEAD is a symbolic reference to the current branch. Creating a commit moves the branch it points to; HEAD still refers to that branch.',
    'Wskazuje na': 'Points to',
    'Gałąź przechowuje identyfikator ostatniego commita. To mały wskaźnik — nie osobna kopia plików.': 'A branch stores the ID of its latest commit. It is a small reference, not a separate copy of your files.',
    'Ta gałąź jeszcze nie ma commita. Jej plik refs/heads powstanie przy pierwszym commicie.': 'This branch has no commits yet. Its refs/heads file will be created with the first commit.',
    'Index · plan następnego commita': 'Index · your next commit',
    'Indeks zawiera całą planowaną migawkę, także niezmienione pliki. Lista staging area pokazuje tylko różnice względem HEAD.': 'The index contains the entire planned snapshot, including unchanged files. The staging area lists only differences from HEAD.',
    'Ścieżka': 'Path', 'Tryb': 'Mode', 'Nazwa': 'Name', 'Typ': 'Type', 'Obiekt': 'Object',
    'Zapisana treść pliku. Blob nie zawiera nazwy ani ścieżki — te przechowuje nadrzędny tree.': 'The saved contents of a file. A blob has no name or path; its parent tree stores those.',
    '(pusty plik)': '(empty file)',
    'Tree łączy nazwy, tryby i wskaźniki na bloby oraz podfoldery.': 'A tree links names and modes to blobs and subdirectories.',
    'Commit wskazuje na główny tree oraz poprzedni commit. Jest niezmienną migawką całego indeksu.': 'A commit points to the root tree and its parent commit. It is an immutable snapshot of the entire index.',
    'Wiadomość': 'Message', 'Główny tree': 'Root tree', 'Pliki': 'Files',
    'Pierwszy commit — brak rodzica': 'First commit — no parent',
    'Wybierz obiekt na grafie': 'Select an object in the graph',
    'Kliknij HEAD, gałąź, commit, tree lub blob, aby sprawdzić jego zawartość i wskaźniki.': 'Click HEAD, a branch, a commit, a tree or a blob to inspect its contents and references.',
    'Masz niezapisane zmiany': 'You have unsaved changes',
    'Zapisz zawartość edytora do working tree albo odrzuć bieżącą edycję.': 'Save the editor contents to the working tree or discard your current edits.',
    'Odrzuć edycję': 'Discard edits', 'Zapisz i kontynuuj': 'Save and continue',
    'Zapisano w working tree. Teraz możesz wykonać git add.': 'Saved to the working tree. You can now run git add.',
    'Nowy folder': 'New folder', 'Nowy plik': 'New file',
    'Puste foldery pozostają w working tree. Git zapisze folder dopiero wtedy, gdy dodasz jego pliki.': 'Empty folders stay in the working tree. Git will store a folder only after you stage files inside it.',
    'Podaj nazwę lub ścieżkę względną. Foldery nadrzędne utworzą się automatycznie.': 'Enter a name or a relative path. Parent folders will be created automatically.',
    'Ścieżka folderu': 'Folder path', 'Ścieżka pliku': 'File path',
    'src/notatki.txt': 'src/notes.txt', 'nowy-plik.txt': 'new-file.txt',
    'Anuluj': 'Cancel', 'Utwórz folder': 'Create folder', 'Utwórz plik': 'Create file',
    'Przenieś': 'Move',
    'w working tree. Dodaj potem zmiany do indeksu, aby zapisać nowe ścieżki w commicie.': 'in the working tree. Then stage the changes to save the new paths in a commit.',
    'Nowa ścieżka': 'New path', 'Zmień': 'Rename',
    'Zapisane wersje trafiły do staging area.': 'The saved versions are now staged.',
    'Commit utworzony. Gałąź wskazuje na nową migawkę.': 'Commit created. The branch now points to the new snapshot.',
    'Usunięcie to brak ścieżki w indeksie. Poprzedni blob zostaje w .git.': 'A deletion means the path is absent from the index. The previous blob stays in .git.',
    'Usuń z working tree': 'Delete from working tree', 'Usunąć': 'Delete',
    'wraz z zawartością': 'and its contents',
    '? Istniejące commity zachowają zapisane wersje. Operację możesz cofnąć.': '? Existing commits will keep their saved versions. You can undo this operation.',
    'wraz z zawartością? Istniejące commity zachowają zapisane wersje. Operację możesz cofnąć.': 'and its contents? Existing commits will keep their saved versions. You can undo this operation.',
    'Usuń': 'Delete',
    'Nowa gałąź będzie wskazywać na bieżący commit. Możesz ją potem wybrać nad grafem.': 'The new branch will point to the current commit. You can then select it above the graph.',
    'Nazwa gałęzi': 'Branch name', 'eksperyment': 'experiment',
    'Cofnięto ostatnią operację symulatora.': 'Undid the last simulator operation.',
    'Wybierz punkt startowy. Bieżącą sesję zastąpi nowe repozytorium; możesz wrócić do niej przyciskiem „Cofnij”.': 'Choose a starting point. A new repository will replace your current session; use Undo to return to it.',
    'Od git init': 'From git init',
    'Brak commitów. Trzy przykładowe pliki czekają na git add.': 'No commits yet. Three example files are ready for git add.',
    'Z pierwszym commitem': 'With a first commit',
    'Gotowy graf. Edytuj pliki i obserwuj kolejne migawki.': 'A ready-made graph. Edit files and watch new snapshots appear.',
    'Git, krok po kroku': 'Git, step by step',
    'Edytuj w working tree': 'Edit in the working tree',
    'Wybierz plik, zmień treść i kliknij „Zapisz zmiany”. To Twoje zwykłe pliki projektu.': 'Select a file, edit its contents and click “Save changes”. These are your regular project files.',
    'Dodaj wersję do indeksu': 'Stage a version',
    '<code>git add</code> zapisuje blob w <code>.git/objects</code> i aktualizuje <code>.git/index</code>. Kolejna edycja pliku nie zmienia już tej wersji.': '<code>git add</code> writes a blob to <code>.git/objects</code> and updates <code>.git/index</code>. Editing the file again does not change this staged version.',
    'Utwórz commit': 'Create a commit',
    'Wpisz wiadomość i kliknij „Commit”. Git buduje drzewa z całego indeksu i zapisuje commit wskazujący na główny tree oraz rodzica.': 'Enter a message and click “Commit”. Git builds trees from the entire index and saves a commit that points to the root tree and its parent.',
    'Podążaj za wskaźnikami': 'Follow the references',
    '<code>HEAD → branch → commit → tree → blob</code>. Klikaj węzły, aby zobaczyć ich treść. Gałąź przesuwa się do nowego commita, a stare obiekty zostają.': '<code>HEAD → branch → commit → tree → blob</code>. Click nodes to inspect their contents. The branch moves to the new commit while old objects remain.',
    'Sprawdź, co się powtarza': 'See what gets reused',
    'Te same treści mają ten sam hash. Niezmienione bloby i drzewa są współdzielone. Git nie zapisuje pustych folderów ani nazw plików w blobach.': 'Identical contents have the same hash. Unchanged blobs and trees are shared. Git does not store empty folders or file names inside blobs.',
    'Eksperymentuj z gałęziami': 'Experiment with branches',
    'Przycisk „+” nad grafem tworzy gałąź. W tym symulatorze zatwierdź wszystkie zmiany przed przełączeniem. Sesja zapisuje się lokalnie w przeglądarce.': 'The “+” button above the graph creates a branch. In this simulator, commit all changes before switching branches. Your session is saved locally in the browser.',
    'Więcej: oficjalna książka Pro Git ↗': 'Learn more: the official Pro Git book ↗',
    'To symulator w pamięci przeglądarki. Nie zmienia plików ani repozytoriów na Twoim dysku. Hashowanie blobów, drzew i commitów odpowiada formatowi Git SHA-1; pomijamy kompresję, packfile, merge i zdalne repozytoria.': 'This simulator runs in your browser. It does not change files or repositories on your disk. Blob, tree and commit hashes follow the Git SHA-1 format; compression, packfiles, merges and remote repositories are omitted.',
    'wskaźnik': 'reference', 'brak commita': 'no commit yet', 'w indeksie': 'in index',
    'Zachowany blob': 'Retained blob', 'Zachowane tree': 'Retained tree',
    'Ścieżki:': 'Paths:', 'wspólny': 'shared',
    'Podaj względną ścieżkę, np. src/notatki.txt.': 'Enter a relative path, for example src/notes.txt.',
    'Ścieżka nie może zawierać .git, pustych segmentów, . ani ...': 'The path must not contain .git, empty segments, . or ..',
    'Ścieżka może mieć najwyżej 240 znaków.': 'The path can contain at most 240 characters.',
    'Ta ścieżka już istnieje.': 'This path already exists.',
    'Plik nie może być folderem nadrzędnym.': 'A file cannot be a parent folder.',
    'Pod tą ścieżką istnieje folder.': 'A folder already exists at this path.',
    'Plik już nie istnieje.': 'This file no longer exists.',
    'Wybierz istniejący plik lub folder.': 'Select an existing file or folder.',
    'Podaj inną nazwę lub ścieżkę.': 'Enter a different name or path.',
    'Folderu nie można przenieść do jego wnętrza.': 'A folder cannot be moved inside itself.',
    'Napisz krótką wiadomość commita.': 'Enter a short commit message.',
    'Najpierw dodaj zmiany do staging area.': 'Stage some changes first.',
    'Podaj nazwę gałęzi, np. eksperyment lub feature/menu.': 'Enter a branch name, for example experiment or feature/menu.',
    'Taka gałąź lub kolidująca ścieżka już istnieje.': 'This branch or a conflicting path already exists.',
    'Utwórz pierwszy commit przed dodaniem gałęzi.': 'Create your first commit before adding a branch.',
    'Nie ma takiej gałęzi.': 'This branch does not exist.',
    'W tym symulatorze zatwierdź zmiany przed przełączeniem gałęzi.': 'In this simulator, commit your changes before switching branches.',
    'Nowy plik jest tylko w working tree. Dodaj go do indeksu, aby go śledzić.': 'The new file exists only in the working tree. Stage it to start tracking it.',
    'Git nie zapisuje pustych folderów. Dodaj do niego plik, aby znalazł się w commicie.': 'Git does not store empty folders. Add a file inside it to include it in a commit.',
    'Zmienił się working tree. Wersja w indeksie i istniejące commity pozostają bez zmian.': 'The working tree changed. The staged version and existing commits remain unchanged.',
    'Usunięcie jest zmianą w working tree. Dodaj je do staging area, aby zatwierdzić je w commicie.': 'The deletion is a working tree change. Stage it to include it in a commit.',
    'Przeniesiono pliki w working tree. Indeks pozostaje bez zmian; git add zapisze nowe ścieżki. Niezmienione bloby zostaną użyte ponownie.': 'Files were moved in the working tree. The index is unchanged; git add will record the new paths. Unchanged blobs will be reused.',
    'Indeks wskazuje na blob zapisanej teraz wersji. Blob powstał już w .git/objects, przed commitem.': 'The index points to a blob of the version saved now. The blob is already in .git/objects, before the commit.',
    'Wszystkie zapisane zmiany, także usunięcia, trafiły do indeksu. Commit użyje dokładnie tych wersji.': 'All saved changes, including deletions, are staged. The commit will use these exact versions.',
    'Indeks wrócił do wersji z HEAD. Working tree i zapisane bloby pozostają bez zmian.': 'The index was restored to the HEAD version. The working tree and stored blobs remain unchanged.',
    'Nowa gałąź to kolejny wskaźnik na istniejący commit. Nie kopiuje obiektów.': 'A new branch is another reference to an existing commit. It does not copy objects.',
    'Repozytorium ma pierwszy commit. Edytuj plik i sprawdź, jak zmieni się graf.': 'The repository has its first commit. Edit a file and watch the graph change.',
    'Repozytorium jest gotowe. Trzy przykładowe pliki czekają na pierwszy git add.': 'The repository is ready. Three example files are waiting for their first git add.',
  };
  function t(source) {
    if (language !== 'en' || typeof source !== 'string') return source;
    if (Object.prototype.hasOwnProperty.call(english, source)) return english[source];
    let match = source.match(/^Powstał commit ([a-f0-9]+)\. Gałąź (.+) wskazuje teraz na niego\. Poprzednie obiekty pozostają w bazie\.$/);
    if (match) return `Created commit ${match[1]}. Branch ${match[2]} now points to it. Previous objects remain in the database.`;
    match = source.match(/^HEAD wskazuje teraz na (.+)\. Working tree i indeks odtworzono z jej ostatniego commita\.$/);
    if (match) return `HEAD now points to ${match[1]}. The working tree and index were restored from its latest commit.`;
    match = source.match(/^Utworzono gałąź (.+)\. Wybierz ją nad grafem\.$/);
    if (match) return `Created branch ${match[1]}. Select it above the graph.`;
    match = source.match(/^(\d+) w migawce$/);
    if (match) return `${match[1]} in snapshot`;
    return source;
  }
  function plural(n, forms) {
    const index = language === 'en' ? (n === 1 ? 0 : 2) : n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 1 : 2;
    return `${n} ${t(forms[index])}`;
  }
  function command(source) {
    if (language !== 'en') return source;
    return source.replace(/^(utwórz|edytuj|usuń) /, (_, verb) => ({ utwórz: 'create', edytuj: 'edit', usuń: 'delete' })[verb] + ' ');
  }
  function setLanguage(value) {
    if (!['pl', 'en'].includes(value)) return false;
    language = value;
    try { root.localStorage?.setItem(storageKey, value); } catch { /* The switch still works without storage. */ }
    return true;
  }
  const protectedText = 'script,style,textarea,pre,td.mono,.path-button,.latest-message,.branch-tag,.file-name,.object-link,.title-text,[data-user-text]';
  const textAttributes = ['aria-label', 'title', 'placeholder'];
  function bindings(container) {
    const document = container.ownerDocument || container;
    const walker = document.createTreeWalker(container, 4);
    const result = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent.trim() && !node.parentElement?.closest(protectedText)) result.push({ node, source: node.textContent });
    }
    for (const node of container.querySelectorAll('*')) {
      if (node.closest(protectedText) && node.tagName !== 'TEXTAREA') continue;
      for (const attribute of textAttributes) if (node.hasAttribute(attribute)) result.push({ node, attribute, source: node.getAttribute(attribute) });
    }
    return result;
  }
  function apply(list) {
    for (const { node, attribute, source } of list) {
      if (attribute) node.setAttribute(attribute, t(source));
      else node.textContent = source.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, before, text, after) => before + t(text) + after);
    }
  }
  function translateUI(container) { apply(bindings(container)); }
  function bindStatic(document) {
    const original = bindings(document);
    return () => {
      apply(original.filter(binding => binding.node.isConnected));
      document.documentElement.lang = language;
      for (const button of document.querySelectorAll('[data-language]')) button.setAttribute('aria-pressed', String(button.dataset.language === language));
    };
  }
  const api = { t, plural, command, setLanguage, translateUI, bindStatic, get language() { return language; }, get locale() { return language === 'en' ? 'en-GB' : 'pl-PL'; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GitI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
