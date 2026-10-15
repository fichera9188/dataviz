/* Animate the SVG marks rendered by Vega-Lite; never interpolate the data. */
(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const played = new WeakSet();
  const waiting = new Map();
  const running = new Map();
  let clipId = 0;
  const enabled = () => !preference.matches && !window.matchMedia('print').matches;
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !waiting.has(entry.target)) continue;
      const play = waiting.get(entry.target);
      waiting.delete(entry.target);
      observer.unobserve(entry.target);
      if (!enabled() || played.has(entry.target)) continue;
      played.add(entry.target);
      play();
    }
  }, {threshold: .2, rootMargin: '0px 0px -8% 0px'}) : null;

  function finish(element) {
    observer?.unobserve(element);
    waiting.delete(element);
    running.get(element)?.();
  }
  function watch(element, play) {
    if (!observer || !enabled() || played.has(element)) return;
    observer.unobserve(element);
    waiting.set(element, play);
    observer.observe(element);
  }
  function track(element, cleanup) {
    element.dataset.reveal = 'running';
    const complete = () => {
      if (running.get(element) !== complete) return;
      cleanup();
      running.delete(element);
      element.dataset.reveal = 'complete';
    };
    running.set(element, complete);
    return complete;
  }
  function chapters() {
    for (const heading of document.querySelectorAll('.chapter-heading')) {
      if (typeof heading.animate !== 'function') continue;
      watch(heading, () => {
        const animation = heading.animate([
          {opacity: 0, transform: 'translateY(8px)'},
          {opacity: 1, transform: 'translateY(0)'}
        ], {duration: 400, easing: 'cubic-bezier(.2,.65,.3,1)'});
        const complete = track(heading, () => animation.cancel());
        animation.finished.then(complete, complete);
      });
    }
  }
  function trend(container) {
    const svg = container.querySelector('svg');
    const marks = Array.from(container.querySelectorAll(
      '.availability_area_marks,.availability_line_marks,.availability_hover_marks,' +
      '.availability_focus_marks,.availability_peak_marks,.availability_latest_marks'
    ));
    if (!svg || marks.length !== 6) return;
    const boxes = marks.map(mark => mark.getBBox());
    const left = Math.min(...boxes.map(box => box.x)) - 2;
    const top = Math.min(...boxes.map(box => box.y)) - 4;
    const right = Math.max(...boxes.map(box => box.x + box.width)) + 2;
    const bottom = Math.max(...boxes.map(box => box.y + box.height)) + 4;
    const namespace = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(namespace, 'defs');
    const clip = document.createElementNS(namespace, 'clipPath');
    const rect = document.createElementNS(namespace, 'rect');
    clip.id = `story-trend-${++clipId}`;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    rect.setAttribute('x', left);
    rect.setAttribute('y', top);
    rect.setAttribute('height', bottom - top);
    rect.setAttribute('width', 0);
    clip.append(rect); defs.append(clip); svg.prepend(defs);
    const previous = marks.map(mark => mark.getAttribute('clip-path'));
    marks.forEach(mark => mark.setAttribute('clip-path', `url(#${clip.id})`));
    let frame;
    const complete = track(container, () => {
      window.cancelAnimationFrame(frame);
      marks.forEach((mark, index) => {
        if (previous[index] === null) mark.removeAttribute('clip-path');
        else mark.setAttribute('clip-path', previous[index]);
      });
      defs.remove();
    });
    const start = performance.now();
    function draw(now) {
      const progress = Math.min(1, (now - start) / 1600);
      rect.setAttribute('width', (right - left) * progress);
      if (progress === 1) complete();
      else frame = window.requestAnimationFrame(draw);
    }
    frame = window.requestAnimationFrame(draw);
  }
  function waterfall(container) {
    const bars = Array.from(container.querySelectorAll('.mortality_bars_marks > path'))
      .sort((a, b) => a.getBBox().x - b.getBBox().x);
    const labels = Array.from(container.querySelectorAll('.mortality_labels_marks > text'))
      .sort((a, b) => a.getBBox().x - b.getBBox().x);
    if (!bars.length || bars.length !== labels.length || typeof bars[0].animate !== 'function') return;
    const animations = [];
    bars.forEach((bar, index) => {
      for (const mark of [bar, labels[index]]) animations.push(mark.animate(
        [{opacity: 0}, {opacity: 1}],
        {duration: 180, delay: index * 130, fill: 'backwards', easing: 'ease-out'}
      ));
    });
    const complete = track(container, () => animations.forEach(animation => animation.cancel()));
    Promise.all(animations.map(animation => animation.finished)).then(complete, complete);
  }
  function chart(id, container) {
    finish(container);
    if (id === 'availability') watch(container, () => trend(container));
    if (id === 'mortality') watch(container, () => waterfall(container));
  }
  function stopAll() {
    observer?.disconnect(); waiting.clear();
    for (const complete of Array.from(running.values())) complete();
  }
  preference.addEventListener('change', () => {
    stopAll();
    if (!enabled()) return;
    chapters();
    for (const id of ['availability', 'mortality']) {
      const container = document.getElementById(`chart-${id}`);
      if (container?.dataset.status === 'ready') chart(id, container);
    }
  });
  window.addEventListener('beforeprint', () => {
    for (const complete of Array.from(running.values())) complete();
  });
  window.addEventListener('resize', () => {
    for (const complete of Array.from(running.values())) complete();
  });
  window.storyMotion = {chart, finish};
  chapters();
})();
