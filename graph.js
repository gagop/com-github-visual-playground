(function (root) {
  'use strict';
  const { t, plural } = GitI18n;
  const NS = 'http://www.w3.org/2000/svg';
  const palette = {
    head: { fill: '#7161dc', stroke: '#7161dc', color: '#fff' },
    branch: { fill: '#f8f6ff', stroke: '#7161dc', color: '#7161dc' },
    commit: { fill: '#f8f6ff', stroke: '#7161dc', color: '#7161dc' },
    tree: { fill: '#fff7e9', stroke: '#df901e', color: '#df901e' },
    blob: { fill: '#edfafa', stroke: '#098f8e', color: '#098f8e' },
    index: { fill: '#f4f6fb', stroke: '#9096b0', color: '#727991' },
  };
  function element(tag, attributes = {}, text) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const shorten = (text, max = 19) => text.length > max ? text.slice(0, max - 1) + '…' : text;
  class GitGraph {
    constructor(svg, viewport, onSelect) {
      this.svg = svg; this.viewport = viewport; this.onSelect = onSelect;
      this.mode = 'objects'; this.zoom = 1; this.known = new Set(); this.nodes = new Map();
      this.resize = new ResizeObserver(() => this.position()); this.resize.observe(viewport);
      let drag;
      viewport.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('.graph-node')) return;
        drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
        viewport.setPointerCapture(event.pointerId); viewport.classList.add('dragging');
      });
      viewport.addEventListener('pointermove', event => {
        if (!drag) return;
        viewport.scrollLeft = drag.left - event.clientX + drag.x; viewport.scrollTop = drag.top - event.clientY + drag.y;
      });
      const end = () => { drag = null; viewport.classList.remove('dragging'); };
      viewport.addEventListener('pointerup', end); viewport.addEventListener('pointercancel', end);
    }
    build(repo) {
      const { state } = repo, nodes = new Map(), edges = [], names = new Map();
      const add = (id, type, rank, label, detail) => {
        if (nodes.has(id)) { nodes.get(id).rank = Math.max(nodes.get(id).rank, rank); return; }
        nodes.set(id, { id, type, rank, label, detail });
      };
      const link = (from, to, type = 'normal', label = '') => { edges.push({ from, to, type, label }); };
      add('HEAD', 'head', 0, 'HEAD', t('wskaźnik'));
      link('HEAD', 'ref:' + state.head);
      const branches = Object.keys(state.branches).sort((a, b) => a === state.head ? -1 : b === state.head ? 1 : a.localeCompare(b));
      for (const name of branches) {
        const id = state.branches[name];
        add('ref:' + name, 'branch', 1, name, id ? id.slice(0, 7) : t('brak commita'));
        if (id) link('ref:' + name, id);
      }
      for (const id of state.commits) {
        const commit = state.objects[id];
        add(id, 'commit', 2, commit.message, id.slice(0, 7));
        if (commit.parent) link(id, commit.parent, 'parent', 'parent');
      }
      if (this.mode === 'objects') {
        const visit = (id, depth, path) => {
          const object = state.objects[id];
          if (!names.has(id)) names.set(id, new Set());
          names.get(id).add(path || '/');
          add(id, object.type, depth + 3, path ? path.split('/').pop() + (object.type === 'tree' ? '/' : '') : '/', id.slice(0, 7));
          if (object.type === 'tree') for (const entry of [...object.entries].sort((a, b) => a.type === b.type ? 0 : a.type === 'tree' ? -1 : 1)) {
            visit(entry.id, depth + 1, path ? path + '/' + entry.name : entry.name);
            if (!edges.some(edge => edge.from === id && edge.to === entry.id)) link(id, entry.id);
          }
        };
        for (const id of state.commits) { link(id, state.objects[id].tree); visit(state.objects[id].tree, 0, ''); }
        const staged = repo.staged();
        if (staged.length) {
          const count = Object.keys(state.index).length;
          add('INDEX', 'index', 2, '.git/index', plural(count, ['wpis', 'wpisy', 'wpisów']));
          for (const change of staged) if (change.after) {
            if (!names.has(change.after)) names.set(change.after, new Set());
            names.get(change.after).add(change.path);
            add(change.after, 'blob', 4, change.path.split('/').pop(), change.after.slice(0, 7));
            link('INDEX', change.after, 'index', t('w indeksie'));
          }
        }
        for (const object of Object.values(state.objects)) {
          if (!nodes.has(object.id)) add(object.id, object.type, object.type === 'tree' ? 3 : 4, object.type === 'blob' ? t('Zachowany blob') : t('Zachowane tree'), object.id.slice(0, 7));
        }
        for (const [id, paths] of names) {
          const node = nodes.get(id);
          node.paths = [...paths]; node.shared = paths.size > 1;
        }
        for (const node of nodes.values()) if (node.type === 'tree' || node.type === 'blob') {
          node.shared ||= edges.filter(edge => edge.to === node.id).length > 1;
        }
      }
      this.nodes = nodes; this.edges = edges; this.repo = repo;
      const ranks = [];
      for (const node of nodes.values()) (ranks[node.rank] ||= []).push(node);
      const maxRows = Math.max(...ranks.map(rank => rank?.length || 0), 2);
      let x = 22;
      ranks.forEach((rank, i) => {
        if (!rank) return;
        const width = i === 0 ? 76 : i === 1 ? 112 : i === 2 ? 148 : 130;
        rank.forEach((node, row) => {
          node.x = x; node.y = 22 + (maxRows - rank.length) * 47 + row * 94; node.width = width; node.height = node.type === 'head' ? 46 : 65;
          if (node.type === 'head') node.y += 9;
        });
        x += width + (i < 2 ? 35 : 42);
      });
      this.width = x - 20; this.height = maxRows * 94 + 22;
    }
    render(repo, selected, mode = 'objects') {
      this.mode = mode; this.selected = selected; this.build(repo);
      const svg = this.svg; svg.replaceChildren();
      svg.setAttribute('width', this.width); svg.setAttribute('height', this.height); svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
      const defs = element('defs');
      for (const [type, color] of Object.entries(palette)) {
        const marker = element('marker', { id: 'arrow-' + type, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
        marker.append(element('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: color.stroke })); defs.append(marker);
      }
      svg.append(defs);
      for (const edge of this.edges) {
        const from = this.nodes.get(edge.from), to = this.nodes.get(edge.to);
        if (!from || !to) continue;
        const colorType = edge.type === 'parent' ? 'commit' : edge.type === 'index' ? 'index' : to.type;
        let d, lx, ly;
        if (edge.type === 'parent') {
          const fx = from.x + from.width * .35, fy = from.y + from.height, tx = to.x + to.width * .35, ty = to.y;
          d = `M ${fx} ${fy} C ${fx - 15} ${fy + 12}, ${tx - 15} ${ty - 12}, ${tx} ${ty}`; lx = fx - 24; ly = (fy + ty) / 2 + 2;
        } else {
          const fx = from.x + from.width, fy = from.y + from.height / 2, tx = to.x, ty = to.y + to.height / 2, bend = Math.max((tx - fx) * .48, 18);
          d = `M ${fx} ${fy} C ${fx + bend} ${fy}, ${tx - bend} ${ty}, ${tx} ${ty}`; lx = (fx + tx) / 2; ly = (fy + ty) / 2 - 7;
        }
        svg.append(element('path', { d, class: 'graph-edge ' + edge.type, stroke: palette[colorType].stroke, 'marker-end': `url(#arrow-${colorType})` }));
        if (edge.label) svg.append(element('text', { x: lx, y: ly, class: 'edge-label', 'text-anchor': 'middle' }, edge.label));
      }
      for (const node of this.nodes.values()) {
        const colors = palette[node.type];
        const group = element('g', { transform: `translate(${node.x},${node.y})`, class: `graph-node ${node.id === selected ? 'selected' : ''} ${this.known.size && !this.known.has(node.id) ? 'new' : ''}`, role: 'button', tabindex: '0', 'aria-label': `${node.type}: ${node.label}${node.detail ? ', ' + node.detail : ''}`, 'data-node': node.id });
        group.append(element('title', {}, `${node.type}: ${node.label}\n${node.id}${node.paths ? '\n' + t('Ścieżki:') + ' ' + node.paths.join(', ') : ''}`));
        group.append(element('rect', { width: node.width, height: node.height, rx: 6, fill: colors.fill, stroke: colors.stroke, class: 'node-body' }));
        group.append(element('rect', { x: 11, y: 12, width: 10, height: 10, rx: node.type === 'commit' ? 5 : 3, fill: node.type === 'branch' ? 'none' : colors.color, stroke: colors.color, class: 'node-dot' }));
        const label = element('text', { x: 29, y: 21, class: 'node-label' }, shorten(node.label, node.type === 'commit' ? 19 : 16));
        if (node.type === 'head') label.setAttribute('style', 'fill:white');
        group.append(label);
        if (node.type === 'head') group.append(element('text', { x: 29, y: 35, class: 'node-type', fill: '#e4ddff' }, t('wskaźnik')));
        else {
          group.append(element('text', { x: 29, y: 38, class: 'node-hash' }, node.detail));
          group.append(element('text', { x: 29, y: 53, class: 'node-type', fill: colors.color }, node.type + (node.shared ? ' · ' + t('wspólny') : '')));
        }
        group.addEventListener('click', () => this.onSelect(node.id));
        group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.onSelect(node.id); } });
        svg.append(group);
      }
      this.known = new Set(this.nodes.keys()); this.position();
    }
    position() {
      if (!this.width || !this.viewport.clientWidth) return;
      const available = this.viewport.clientWidth;
      // Never reduce text to an unreadable size on small screens; the canvas scrolls.
      const fit = Math.max(available < 600 ? 1 : .85, Math.min(1.1, (available - 18) / this.width));
      this.scale = fit * this.zoom;
      const width = this.width * this.scale, height = this.height * this.scale;
      this.viewport.style.overflowX = width + 16 > available ? 'auto' : 'hidden';
      const sizer = this.svg.parentElement;
      sizer.style.width = Math.max(available, width + 16) + 'px'; sizer.style.height = Math.max(this.viewport.clientHeight, height + 16) + 'px';
      this.svg.style.left = Math.max(0, (available - width) / 2) + 'px'; this.svg.style.top = Math.max(8, (this.viewport.clientHeight - height) / 2) + 'px';
      this.svg.style.transform = `scale(${this.scale})`;
      document.querySelector('#zoom-label').textContent = Math.round(this.scale * 100) + '%';
    }
    setZoom(amount) { this.zoom = Math.min(2.5, Math.max(.65, amount)); this.position(); }
    fit() { this.zoom = 1; this.position(); this.viewport.scrollTo(0, 0); }
    select(id) {
      this.selected = id;
      for (const group of this.svg.querySelectorAll('.graph-node')) group.classList.toggle('selected', group.dataset.node === id);
    }
  }
  root.GitGraph = GitGraph;
})(window);
