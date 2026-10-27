/* Compile and actually render all Vega-Lite charts with their local data.
   A successful compile alone would not catch broken data URLs or empty plots. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {palette, genderScale} from './chart_palette.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'site');
const reportDir=path.join(root,'verification');
await fs.mkdir(reportDir,{recursive:true});
const messages=[];
let currentChart='runtime';
const context=vm.createContext({console:{...console,warn:(...args)=>messages.push(`${currentChart}: ${args.join(' ')}`),error:(...args)=>messages.push(`${currentChart}: ${args.join(' ')}`)},setTimeout,clearTimeout,performance,fetch,URL,TextEncoder,TextDecoder,structuredClone});
vm.runInContext(await fs.readFile(path.join(site,'assets/vendor/vega.min.js'),'utf8'),context);
vm.runInContext(await fs.readFile(path.join(site,'assets/vendor/vega-lite.min.js'),'utf8'),context);
const {vega,vegaLite}=context;
assert(vega&&vegaLite,'Vendored Vega runtimes must load');
const manifest=JSON.parse(await fs.readFile(path.join(site,'specs/manifest.json'),'utf8'));
assert.equal(manifest.length,13);
const loader=vega.loader();
loader.load=async url=>{
  if(/^https?:/.test(url))throw new Error(`Unexpected external runtime data dependency: ${url}`);
  const target=path.resolve(site,url.replace(/^file:\/\//,''));
  assert(target.startsWith(site+path.sep),'Data path escaped site');
  return fs.readFile(target,'utf8');
};
const rendered=[];
for(const id of manifest) {
  currentChart=id;
  const spec=JSON.parse(await fs.readFile(path.join(site,'specs',`${id}.vl.json`),'utf8'));
  const hexes=JSON.stringify(spec).toLowerCase().match(/#[\da-f]{6}/g)||[];
  if(!['gender','hospital'].includes(id)) {
    for(const colour of Object.values(palette.gender))assert(!hexes.includes(colour),`${id}: reserved gender colour used for another meaning`);
  } else {
    for(const colour of Object.values(palette.gender))assert(hexes.includes(colour),`${id}: missing gender colour`);
  }
  // A standalone render has no DOM container from which to infer width.
  spec.width=['world','availability','mortality'].includes(id)?800:460;
  const compiled=vegaLite.compile(spec).spec;
  const view=new vega.View(vega.parse(compiled),{renderer:'none',loader});
  await view.runAsync();
  const svg=await view.toSVG();
  if(!['gender','hospital'].includes(id))for(const colour of Object.values(palette.gender))assert(!svg.toLowerCase().includes(colour),`${id}: rendered a reserved gender colour`);
  function dataMarks() {
    const found=[];
    function visit(item,offsetY=0) {
      if(item.mark&&['rect','symbol'].includes(item.mark.marktype)&&item.datum)found.push({datum:item.datum,fill:item.fill,layoutY:offsetY+(item.y??item.yc??0)});
      const groupY=item.mark?.marktype==='group'?(item.y||0):0;
      for(const child of item.items||[])visit(child,offsetY+groupY);
    }
    visit(view.scenegraph().root); return found;
  }
  if(['gender','hospital'].includes(id)) {
    const marks=dataMarks().filter(item=>item.datum.sex);
    assert(marks.length>=10,`${id}: missing data marks`);
    for(const item of marks)assert.equal(item.fill,palette.gender[item.datum.sex.startsWith('Male')?'Male':'Female'],`${id}: gender colour mapping changed`);
  }
  if(id==='hospital') {
    assert.equal(spec.encoding.x.field,'position');
    const [lo,hi]=spec.encoding.x.scale.domain;
    assert.equal(-lo,hi,'Tornado sides need identical count scales');
    assert.equal(spec.layer[0].encoding.x2.datum,0,'Tornado bars must extend from zero');
    assert.deepEqual(spec.layer[0].encoding.color.scale,genderScale());
    const bars=dataMarks().filter(item=>item.datum.sex);
    assert.equal(bars.length,10,'Tornado needs both sexes in each of five age bands');
    for(const {datum} of bars) {
      assert(datum.count>0,'Hospital episode counts must remain positive');
      assert.equal(datum.position,datum.sex==='Male'?-datum.count:datum.count,'Tornado direction changed');
      assert(svg.includes(datum.count.toLocaleString('en-US')),`Missing exact count label: ${datum.count}`);
    }
    assert(!/>-[\d,]+<\/text>/.test(svg),'Mirrored positions must not produce negative count labels');
  }
  if(id==='burden') {
    const bars=dataMarks().filter(item=>item.datum.disease).sort((a,b)=>a.layoutY-b.layoutY);
    assert.equal(bars.length,6,'Burden needs the five listed groups and the residual');
    assert.equal(new Set(bars.map(bar=>bar.layoutY)).size,6,'Burden bars need six distinct rows');
    assert(bars.every((bar,index)=>index===0||bars[index-1].datum.value>=bar.datum.value),'Burden bars must rank by value');
    assert.equal(spec.encoding.x.field,'value');
    assert.equal(spec.encoding.x.scale.domain[0],0);
  }
  assert(!svg.includes('NaN')&&!svg.includes('Infinity'),`${id}: invalid geometry`);
  assert(svg.includes('<path')||svg.includes('<rect'),`${id}: no rendered marks`);
  await fs.writeFile(path.join(reportDir,`${id}.svg`),svg);
  // Check all exposed control options, including data sets with different totals.
  const options={world:{mapYear:[2000,2005,2010,2015,2020,2024]},episodic:{hedSex:['Male','Female']},age:{ageMeasure:['Daily drinking','Risky drinking','More than 10 drinks weekly']},
    adolescent:{studentGroup:['Male students','Female students','Ages 12–15','Ages 16–17','All students'],studentMeasure:['Ever','Past year','Past week','Risky past week','Past month']},mosaic:{mosaicGender:['Males','Females']},
    states:{stateGender:['Males','Females']},treatment:{treatmentYear:[2015,2018,2021,2023,2024]},burden:{burdenSex:['Male','Female']},mortality:{mortalitySex:['Male','Female']}};
  for(const [signal,values] of Object.entries(options[id]||{})) {
    for(const value of values) {
      const before=await view.toSVG();
      await view.signal(signal,value).runAsync();
      const alternative=await view.toSVG();
      assert(!alternative.includes('NaN')&&!alternative.includes('Infinity'),`${id}/${signal}/${value}: invalid render`);
      assert(alternative!==before,`${id}/${signal}/${value}: selector did not change rendered output`);
      if(id==='burden') {
        const ordered=dataMarks().filter(item=>item.datum.disease).sort((a,b)=>a.layoutY-b.layoutY);
        assert(ordered.every((bar,index)=>index===0||ordered[index-1].datum.value>=bar.datum.value),`Burden ranking did not update for ${value}`);
      }
    }
  }
  view.finalize();rendered.push({chart:id,svg_bytes:Buffer.byteLength(svg)});
}
const sources=JSON.parse(await fs.readFile(path.join(site,'data/sources.json'),'utf8'));
assert.equal(sources.length,10);
for(const source of sources)for(const name of source.data)await fs.access(path.join(site,'data',name+'.json'));
const html=await fs.readFile(path.join(site,'index.html'),'utf8');
assert.equal((html.match(/class="viz"/g)||[]).length,13);
assert(html.includes('Teh Ming Dong'));
assert(!/chart-reading|chart-rationale|Why this chart|Why these chart choices/.test(html),'Design justifications belong in Markdown, not the visualisation');
assert(!/aria-describedby="reading-/.test(html),'Removed notes must not leave broken accessible descriptions');
const design=await fs.readFile(path.join(root,'CHART_DESIGN.md'),'utf8');
assert.equal((design.match(/^## \d\d\./gm)||[]).length,13,'Markdown must justify all thirteen charts');
for(const label of ['Question','How to read it','Why this chart','Alternative considered','Limitations'])assert.equal((design.match(new RegExp(`\\*\\*${label}:\\*\\*`,'g'))||[]).length,13,`Markdown needs thirteen ${label} entries`);
const sourceAcronyms=/\b(?:WHO|AIHW|ABS|ASSAD|NDSHS|NHS|NHMD\d*|ABDS\d*)\b/;
assert(!sourceAcronyms.test(html.replace(/<[^>]*>/g,' ')),'Visible page source names must be written in full');
for(const source of sources)for(const field of ['title','publisher','coverage','measure','note'])assert(!sourceAcronyms.test(source[field]),`${source.id}: abbreviated ${field}`);
for(const id of ['age','states']) {
  const dataset=JSON.parse(await fs.readFile(path.join(site,`data/${id==='age'?'age-trends':'state-risk'}.json`),'utf8'));
  assert(dataset.every(row=>row.value===null||(row.value>=0&&row.value<=60)),`${id}: data outside fixed 0–60% colour domain`);
  const spec=JSON.parse(await fs.readFile(path.join(site,`specs/${id}.vl.json`),'utf8'));
  const scale=(id==='age'?spec.encoding:spec.layer[0].encoding).color.scale;
  assert.deepEqual(scale.domain,[0,60]); assert.deepEqual(scale.range,palette.magnitude);
}
const css=await fs.readFile(path.join(site,'styles.css'),'utf8');
for(const colour of Object.values(palette.gender))assert(!css.toLowerCase().includes(colour),'Page decoration must not borrow a gender colour');
function luminance(hex) {
  const linear=hex.slice(1).match(/../g).map(part=>parseInt(part,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
}
function contrast(a,b) {const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (values[0]+.05)/(values[1]+.05);}
for(const colour of [palette.ink,palette.series,...Object.values(palette.gender)])assert(contrast(colour,palette.paper)>=4.5,`Insufficient label contrast: ${colour}`);
for(const colour of [palette.beverage.Wine,palette.beverage['Spirits & RTDs'],palette.pattern['Weekly only'],palette.pattern['Both thresholds']])assert(contrast(palette.paper,colour)>=4.5,`Insufficient reversed label contrast: ${colour}`);
assert(palette.magnitude.every((colour,i)=>i===0||luminance(palette.magnitude[i-1])>luminance(colour)),'Magnitude ramp must darken monotonically');
// Full-severity Machado et al. (2009) matrices, as published by Colorspacious:
// https://github.com/njsmith/colorspacious/blob/master/colorspacious/cvd.py
const visionMatrices={
  protanopia:[[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
  deuteranopia:[[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]],
  tritanopia:[[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.303900]],
  greyscale:[[.2126,.7152,.0722],[.2126,.7152,.0722],[.2126,.7152,.0722]],
};
function simulate(hex,matrix) {
  const rgb=hex.slice(1).match(/../g).map(part=>parseInt(part,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
  const transformed=matrix.map(row=>Math.min(1,Math.max(0,row.reduce((sum,coefficient,index)=>sum+coefficient*rgb[index],0))));
  return '#'+transformed.map(x=>Math.round(255*(x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055)).toString(16).padStart(2,'0')).join('');
}
const visionAudit={};
for(const [name,matrix] of Object.entries(visionMatrices)) {
  const ramp=palette.magnitude.map(colour=>simulate(colour,matrix));
  assert(ramp.every((colour,i)=>i===0||luminance(ramp[i-1])>luminance(colour)),`${name}: magnitude order changed`);
  visionAudit[name]={gender:Object.fromEntries(Object.entries(palette.gender).map(([key,colour])=>[key,simulate(colour,matrix)])),magnitude:ramp};
}
await fs.writeFile(path.join(reportDir,'colour-audit.json'),JSON.stringify({gender_labels_min_contrast:Math.min(...Object.values(palette.gender).map(colour=>contrast(colour,palette.paper))),vision_simulations:visionAudit,redundant_encoding:'Male circles / female squares; hospital males extend left and females right; all categories have labels.'},null,2));
let dataBytes=0;
for(const name of await fs.readdir(path.join(site,'data')))dataBytes+=(await fs.stat(path.join(site,'data',name))).size;
assert(dataBytes<2_000_000,`Data must be below2MB; found${dataBytes}`);
const geometry=JSON.parse(await fs.readFile(path.join(site,'data/world.geo.json'),'utf8'));
const rows=JSON.parse(await fs.readFile(path.join(site,'data/world-consumption.json'),'utf8'));
const keys=new Set(geometry.features.map(f=>f.properties.iso3));
assert.equal(keys.size,geometry.features.length,'World lookup keys must be unique');
const latest=rows.filter(r=>r.year===2024);
const unmatched=latest.filter(r=>!keys.has(r.iso3)).map(r=>r.iso3);
const report={verified_at:new Date().toISOString(),vega_version:vega.version,vega_lite_version:vegaLite.version,rendered_charts:rendered.length,data_products:sources.length,data_bytes:dataBytes,latest_map_values:latest.length,unmatched_latest_map_keys:unmatched,compiler_warnings:messages,charts:rendered};
await fs.writeFile(path.join(reportDir,'checks.json'),JSON.stringify(report,null,2));
if(messages.length){console.error(JSON.stringify(messages,null,2));process.exitCode=1;}
console.log(JSON.stringify(report,null,2));
