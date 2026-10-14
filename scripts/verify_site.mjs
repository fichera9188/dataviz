/* Compile and actually render all Vega-Lite charts with their local data.
   A successful compile alone would not catch broken data URLs or empty plots. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'site');
const reportDir=path.join(root,'verification');
await fs.mkdir(reportDir,{recursive:true});
const messages=[];
const context=vm.createContext({console:{...console,warn:(...args)=>messages.push(args.join(' ')),error:(...args)=>messages.push(args.join(' '))},setTimeout,clearTimeout,performance,fetch,URL,TextEncoder,TextDecoder,structuredClone});
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
  const spec=JSON.parse(await fs.readFile(path.join(site,'specs',`${id}.vl.json`),'utf8'));
  // A standalone render has no DOM container from which to infer width.
  spec.width=['world','availability','mortality'].includes(id)?800:460;
  const compiled=vegaLite.compile(spec).spec;
  const view=new vega.View(vega.parse(compiled),{renderer:'none',loader});
  await view.runAsync();
  const svg=await view.toSVG();
  assert(!svg.includes('NaN')&&!svg.includes('Infinity'),`${id}: invalid geometry`);
  assert(svg.includes('<path')||svg.includes('<rect'),`${id}: no rendered marks`);
  await fs.writeFile(path.join(reportDir,`${id}.svg`),svg);
  // Check all exposed control options, including data sets with different totals.
  const options={world:{mapYear:[2000,2024]},episodic:{hedSex:['Male','Female']},age:{ageMeasure:['Daily drinking','Risky drinking','More than 10 drinks weekly']},
    adolescent:{studentGroup:['Ages 12–15','Ages 16–17'],studentMeasure:['Ever','Risky past week']},mosaic:{mosaicGender:['Males','Females']},
    states:{stateGender:['Males','Females']},treatment:{treatmentYear:[2015,2024]},burden:{burdenSex:['Male','Female']},mortality:{mortalitySex:['Male','Female']}};
  for(const [signal,values] of Object.entries(options[id]||{})) {
    for(const value of values) {
      const before=await view.toSVG();
      await view.signal(signal,value).runAsync();
      const alternative=await view.toSVG();
      assert(!alternative.includes('NaN')&&!alternative.includes('Infinity'),`${id}/${signal}/${value}: invalid render`);
      assert(alternative!==before,`${id}/${signal}/${value}: selector did not change rendered output`);
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
