/* Check animation cancellation and static fallbacks without a browser dependency. */
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = await fs.readFile(new URL('../site/motion.js', import.meta.url), 'utf8');

function setup({reduced = false, observers = true} = {}) {
  const animations = [], frames = new Map(), events = new Map(), observed = new Set();
  let onIntersection, onPreference, frameId = 0;
  class Element {
    constructor(x = 0) { this.dataset = {}; this.attrs = new Map(); this.children = []; this.x = x; }
    getBBox() { return {x: this.x, y: 10, width: 100, height: 60}; }
    getAttribute(name) { return this.attrs.get(name) ?? null; }
    setAttribute(name, value) { this.attrs.set(name, String(value)); }
    removeAttribute(name) { this.attrs.delete(name); }
    append(child) { child.parent = this; this.children.push(child); }
    prepend(child) { child.parent = this; this.children.unshift(child); }
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
    querySelector(selector) { return selector === 'svg' ? this.svg : null; }
    querySelectorAll(selector) {
      if (selector.includes('availability_area_marks')) return this.marks ?? [];
      if (selector.includes('mortality_bars_marks')) return this.bars ?? [];
      if (selector.includes('mortality_labels_marks')) return this.labels ?? [];
      return [];
    }
    animate(keyframes, options) {
      let reject;
      const animation = {keyframes, options, cancelled: false,
        finished: new Promise((_, fail) => { reject = fail; }),
        cancel() { this.cancelled = true; reject(new Error('cancelled')); }};
      animations.push(animation);
      return animation;
    }
  }
  const heading = new Element(), trend = new Element(), mortality = new Element();
  trend.svg = new Element(); trend.marks = Array.from({length: 6}, () => new Element());
  mortality.bars = Array.from({length: 11}, (_, index) => new Element(index * 120));
  mortality.labels = Array.from({length: 11}, (_, index) => new Element(index * 120));
  const preference = {matches: reduced, addEventListener: (_, callback) => { onPreference = callback; }};
  const document = {
    querySelectorAll: () => [heading], createElementNS: () => new Element(),
    getElementById: id => id === 'chart-availability' ? trend : mortality
  };
  const window = {
    matchMedia: query => query.includes('reduce') ? preference : {matches: false},
    addEventListener: (name, callback) => events.set(name, callback),
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id)
  };
  class Observer {
    constructor(callback) { onIntersection = callback; }
    observe(element) { observed.add(element); }
    unobserve(element) { observed.delete(element); }
    disconnect() { observed.clear(); }
  }
  if (observers) window.IntersectionObserver = Observer;
  vm.runInNewContext(source, {window, document, IntersectionObserver: Observer, performance: {now: () => 0}});
  return {motion: window.storyMotion, heading, trend, mortality, animations, frames, observed,
    enter: target => onIntersection([{target, isIntersecting: true}]),
    reduce: value => { preference.matches = value; onPreference(); },
    event: name => events.get(name)(),
    tick: now => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)); }};
}

// Reduced-motion and older browsers leave all content static and readable.
for (const options of [{reduced: true}, {observers: false}]) {
  const state = setup(options);
  state.motion.chart('availability', state.trend);
  state.motion.chart('mortality', state.mortality);
  assert.equal(state.observed.size, 0);
  assert.equal(state.animations.length, 0);
  assert.equal(state.trend.svg.children.length, 0);
}

const state = setup();
state.enter(state.heading);
assert.equal(state.animations[0].options.duration, 400);
state.motion.finish(state.heading);
assert(state.animations[0].cancelled);
state.motion.chart('availability', state.trend);
state.enter(state.trend);
assert(state.trend.marks.every(mark => mark.getAttribute('clip-path')));
state.tick(800);
const rect = state.trend.svg.children[0].children[0].children[0];
assert.equal(Number(rect.getAttribute('width')), 52, 'Trend should reveal half its 104px extent after 800ms');
state.reduce(true);
assert.equal(state.frames.size, 0);
assert.equal(state.trend.svg.children.length, 0);
assert(state.trend.marks.every(mark => mark.getAttribute('clip-path') === null));
assert.equal(state.trend.dataset.reveal, 'complete');
state.reduce(false);
state.motion.chart('availability', state.trend);
assert(!state.observed.has(state.trend), 'Viewed charts must not replay');

state.motion.chart('mortality', state.mortality);
state.enter(state.mortality);
const sequence = state.animations.slice(1);
assert.equal(sequence.length, 22);
assert.equal(sequence[0].options.delay, 0);
assert.equal(sequence.at(-1).options.delay, 1300);
state.motion.finish(state.mortality); // The filter-change path.
assert(sequence.every(animation => animation.cancelled));
assert.equal(state.mortality.dataset.reveal, 'complete');
state.motion.chart('mortality', state.mortality);
assert(!state.observed.has(state.mortality));

for (const event of ['resize', 'beforeprint']) {
  const next = setup(); next.motion.chart('availability', next.trend); next.enter(next.trend);
  next.event(event);
  assert.equal(next.trend.svg.children.length, 0);
  assert.equal(next.frames.size, 0);
}
const completed = setup(); completed.motion.chart('availability', completed.trend); completed.enter(completed.trend);
completed.tick(1600);
assert.equal(completed.trend.svg.children.length, 0, 'Finished reveals must remove temporary clipping');
await Promise.resolve();
console.log('Motion checks passed: reveal order, completion, cancellation, reduced motion, print and static fallback.');
