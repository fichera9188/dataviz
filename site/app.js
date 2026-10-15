/* All chart marks are rendered by Vega-Lite. This file connects accessible
   page controls to Vega-Lite parameters and provides source information. */
'use strict';
const views = new Map();
const pending = new Map();
const specs = new Map();
const chartIds = ['world','episodic','availability','beverages','age','adolescent','gender','mosaic','states','treatment','hospital','burden','mortality'];
let worldData = [], adolescentData = [], deathsData = [];

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response.json();
}
function valueFor(control) {
  return control.dataset.type === 'number' ? Number(control.value) : control.value;
}
function applyInitialControls(id, spec) {
  for (const control of document.querySelectorAll(`[data-chart="${id}"]`)) {
    const param = spec.params?.find(p => p.name === control.dataset.signal);
    if (param) param.value = valueFor(control);
  }
}
async function renderChart(id) {
  if (pending.has(id)) return pending.get(id);
  const job = (async () => {
    const container = document.getElementById(`chart-${id}`);
    window.storyMotion?.finish(container);
    container.setAttribute('aria-busy', 'true');
    try {
      const spec = specs.has(id) ? structuredClone(specs.get(id)) : await json(`specs/${id}.vl.json?v=20261015-story-motion`);
      specs.set(id, structuredClone(spec));
      applyInitialControls(id, spec);
      if (views.has(id)) views.get(id).finalize();
      const result = await vegaEmbed(container, spec, {
        mode:'vega-lite', renderer:'svg', actions:false, tooltip:{theme:'light'},
        loader:vega.loader({baseURL:new URL('.', window.location.href).href}),
      });
      views.set(id, result.view);
      container.dataset.status = 'ready';
      container.setAttribute('aria-busy','false');
      updateNarrative();
      window.storyMotion?.chart(id, container);
    } catch (error) {
      container.dataset.status='error';
      container.setAttribute('aria-busy','false');
      container.replaceChildren();
      const block=document.createElement('div'); block.className='chart-error';
      const text=document.createElement('span');text.textContent='This chart could not load. Please retry or open its data source below.';
      const button=document.createElement('button');button.type='button';button.textContent='Retry chart';
      button.addEventListener('click',()=>renderChart(id));block.append(text,button);container.append(block);
      console.error(`Chart ${id} failed`,error);
    }
  })();
  pending.set(id,job);
  try {await job;} finally {pending.delete(id);}
}

function updateNarrative() {
  const year=Number(document.getElementById('world-year').value);
  const australia=worldData.find(r=>r.iso3==='AUS'&&r.year===year);
  if(australia) {
    const element=document.getElementById('world-australia-value');
    element.replaceChildren(document.createTextNode(australia.value.toFixed(1)));
    const unit=document.createElement('span');unit.textContent='L';element.append(unit);
    document.getElementById('world-australia-note').textContent=`WHO’s ${year} estimate is ${australia.value.toFixed(1)} litres per person aged 15+. Australia is outlined on the map.`;
  }
  const group=document.getElementById('student-group').value;
  const measure=document.getElementById('student-measure').value;
  const student=adolescentData.find(r=>r.group===group&&r.measure===measure);
  if(student) {
    const element=document.getElementById('student-value');element.replaceChildren(document.createTextNode(student.value.toFixed(1)));
    const unit=document.createElement('span');unit.textContent='%';element.append(unit);
    const subject={
      'All students':'all surveyed secondary-school students', 'Male students':'surveyed male secondary-school students',
      'Female students':'surveyed female secondary-school students', 'Ages 12–15':'surveyed students aged 12–15', 'Ages 16–17':'surveyed students aged 16–17'
    }[group];
    const behaviour={
      'Ever':'had ever consumed alcohol, including even part of a drink.', 'Past year':'had consumed alcohol in the past year.',
      'Past month':'had consumed alcohol in the past month.', 'Past week':'had consumed alcohol in the past week.',
      'Risky past week':'had consumed five or more drinks on at least one day in the past week.'
    }[measure];
    document.getElementById('student-description').textContent=`of ${subject} ${behaviour}`;
  }
  const sex=document.getElementById('mortality-sex').value;
  const first=deathsData.find(r=>r.sex===sex&&r.year===2015),last=deathsData.find(r=>r.sex===sex&&r.year===2024);
  if(first&&last) {
    document.querySelector('#mortality-note strong').textContent=`${first.count.toLocaleString('en-AU')} → ${last.count.toLocaleString('en-AU')} deaths`;
    document.getElementById('mortality-rate').textContent=`${first.rate.toFixed(1)} → ${last.rate.toFixed(1)} per 100,000`;
  }
}

function sourcesList(rows) {
  const list=document.getElementById('source-list');list.replaceChildren();
  for(const row of rows) {
    const details=document.createElement('details');details.className='source-entry';details.id=`source-${row.id}`;
    const summary=document.createElement('summary');
    const number=document.createElement('span');number.className='source-id';number.textContent=row.id;
    const title=document.createElement('span');title.textContent=row.title;
    summary.append(number,title);details.append(summary);
    const body=document.createElement('div');body.className='source-body';
    for(const [label,key] of [['Publisher','publisher'],['Coverage','coverage'],['Measure','measure'],['Important distinction','note']]) {
      const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=`${label}: `;p.append(strong,document.createTextNode(row[key]));body.append(p);
    }
    const links=document.createElement('p');
    row.links.forEach((link,i)=>{if(i)links.append(document.createTextNode(' · '));const a=document.createElement('a');a.href=link.url;a.textContent=link.label;a.target='_blank';a.rel='noopener';links.append(a);});body.append(links);
    const local=document.createElement('p');local.append(document.createTextNode('Chart data: '));
    row.data.forEach((name,i)=>{if(i)local.append(document.createTextNode(' · '));const a=document.createElement('a');a.href=`data/${name}.json`;a.textContent=name;a.target='_blank';a.rel='noopener';local.append(a);});body.append(local);
    details.append(body);list.append(details);
  }
  // Source citations expand the relevant entry without replacing the story.
  function expandSource() {if(location.hash.startsWith('#source-')) {const el=document.querySelector(location.hash);if(el?.tagName==='DETAILS')el.open=true;}}
  window.addEventListener('hashchange',expandSource);expandSource();
}

function highlightUpdate(id) {
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const elements=[document.getElementById(`chart-${id}`)];
  if(id==='world') elements.push(document.getElementById('world-australia-value'));
  if(id==='adolescent') elements.push(document.getElementById('student-value'));
  if(id==='mortality') elements.push(document.querySelector('.mortality-context'));
  for(const element of elements) {
    element.classList.remove('is-updated');
    // Restart a short emphasis animation even for consecutive filter changes.
    void element.offsetWidth;
    element.classList.add('is-updated');
  }
}
document.addEventListener('animationend',event=>{
  if(event.target.classList.contains('is-updated'))event.target.classList.remove('is-updated');
});

for(const control of document.querySelectorAll('[data-chart]')) {
  control.addEventListener('change',async()=>{
    const id=control.dataset.chart;
    window.storyMotion?.finish(document.getElementById(`chart-${id}`));
    if(pending.has(id)) await pending.get(id);
    const view=views.get(id);
    if(view) {
      try {await view.signal(control.dataset.signal,valueFor(control)).runAsync();}
      catch(error){console.error(`Parameter ${control.dataset.signal} failed`,error);await renderChart(id);}
    }
    updateNarrative();
    highlightUpdate(id);
    const selections=Array.from(document.querySelectorAll(`[data-chart="${id}"]`))
      .map(input=>input.selectedOptions[0].textContent).join(', ');
    const title=document.getElementById(`${id}-title`).textContent;
    document.getElementById('chart-update-status').textContent=`${title}. View updated: ${selections}.`;
  });
}

const navLinks=Array.from(document.querySelectorAll('.nav-inner a'));
function readingState() {
  const available=document.documentElement.scrollHeight-window.innerHeight;
  document.getElementById('reading-progress').style.width=`${available>0?Math.min(100,Math.max(0,window.scrollY/available*100)):0}%`;
  let active=navLinks[0];
  for(const link of navLinks)if(document.querySelector(link.getAttribute('href')).getBoundingClientRect().top<160)active=link;
  for(const link of navLinks){link.classList.toggle('active',link===active);if(link===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
}
window.addEventListener('scroll',readingState,{passive:true});window.addEventListener('resize',readingState);readingState();

async function start() {
  const meta=Promise.allSettled([
    json('data/world-consumption.json').then(d=>{worldData=d;}),
    json('data/adolescent.json').then(d=>{adolescentData=d;}),
    json('data/deaths.json').then(d=>{deathsData=d;}),
    json('data/sources.json').then(sourcesList)
  ]);
  if(document.fonts)await document.fonts.ready;
  if(typeof vegaEmbed==='undefined') {
    for(const id of chartIds){const container=document.getElementById(`chart-${id}`);container.dataset.status='error';container.textContent='The local Vega-Lite runtime could not load. Please reload this page.';}
    return;
  }
  // Render the first chapter immediately, then the rest in a bounded queue.
  await Promise.all(chartIds.slice(0,2).map(renderChart));
  const queue=chartIds.slice(2);
  async function worker(){while(queue.length)await renderChart(queue.shift());}
  await Promise.all([worker(),worker(),worker()]);
  const results=await meta;for(const r of results)if(r.status==='rejected')console.error('Story metadata failed',r.reason);
  updateNarrative();document.body.dataset.chartsReady='true';readingState();
}
start().catch(error=>console.error('Story failed to start',error));
