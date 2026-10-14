import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'site/specs');
await fs.mkdir(output, {recursive: true});
const C = {ink:'#29252e', teal:'#397b76', plum:'#80516b', rust:'#bb5939', gold:'#d59e51', pale:'#eee8dc', grey:'#a39e98'};
const config = {
  background:null, font:'Arial', view:{stroke:null},
  axis:{labelFont:'Arial',titleFont:'Arial',labelFontSize:12,titleFontSize:12,titleFontWeight:400,labelColor:'#625c61',titleColor:'#625c61',domain:false,tickColor:'#ddd4c6',gridColor:'#e5ded3',gridOpacity:.8,titlePadding:13,labelPadding:7},
  legend:{labelFont:'Arial',titleFont:'Arial',labelFontSize:12,titleFontSize:12,titleFontWeight:400,labelColor:'#625c61',titleColor:'#625c61',orient:'bottom',padding:10,offset:16},
  title:{font:'Arial',color:C.ink}, text:{font:'Arial',color:C.ink},
};
const data = name => ({url:`data/${name}.json`});
const q = (field,title,extra={}) => ({field,type:'quantitative',title,...extra});
const n = (field,title,extra={}) => ({field,type:'nominal',title,...extra});
const tooltip = (field,type,title,format) => ({field,type,title,...(format?{format}:{})});
const sexScale = {domain:['Males','Females'],range:[C.teal,C.plum]};
const parameter = (name,value) => ({name,value});
const specs = {};
function add(id,spec,height=310) {
  specs[id] = {$schema:'https://vega.github.io/schema/vega-lite/v6.json',description:spec.description,
    width:'container',height,autosize:{type:'fit',contains:'padding',resize:true},padding:0,config,...spec};
}

add('world', {
  description:'WHO estimated litres of pure alcohol per person aged15+; three-year-average indicator. Country geometry is Natural Earth. Grey means no matched estimate.',
  params:[parameter('mapYear',2024)], projection:{type:'equalEarth'},
  layer:[
    {data:{...data('world.geo'),format:{type:'json',property:'features'}},mark:{type:'geoshape',fill:C.pale,stroke:'#fffaf3',strokeWidth:.55},encoding:{tooltip:[tooltip('properties.name','nominal','Country')] }},
    {data:data('world-consumption'),transform:[{filter:'datum.year === mapYear'},
      {lookup:'iso3',from:{data:{...data('world.geo'),format:{type:'json',property:'features'}},key:'properties.iso3',fields:['geometry','properties.name']},as:['geometry','name']},
      {filter:'isValid(datum.geometry)'}],
      mark:{type:'geoshape',stroke:'#fffaf3',strokeWidth:.55},encoding:{shape:{field:'geometry',type:'geojson'},
        color:q('value','Litres of pure alcohol per adult',{scale:{domain:[0,15],range:['#f1e5cf','#d9ab72','#ae744d','#795447','#43323c'],clamp:true},legend:{gradientLength:220,values:[0,3,6,9,12,15],labelExpr:"datum.value >= 15 ? '15+' : datum.label"}}),
        tooltip:[tooltip('name','nominal','Country'),tooltip('year','ordinal','Estimate year'),tooltip('value','quantitative','Litres per adult','.1f'),tooltip('lower','quantitative','Lower estimate','.1f'),tooltip('upper','quantitative','Upper estimate','.1f')]}},
    {data:{...data('world.geo'),format:{type:'json',property:'features'}},transform:[{filter:"datum.properties.iso3 === 'AUS'"}],mark:{type:'geoshape',fill:null,stroke:C.ink,strokeWidth:1.5}}
  ]
},390);

add('episodic', {
  description:'Distribution of country-level heavy episodic drinking prevalence by WHO region,2020. Each country contributes one observation. The boxes are not individual drinking distributions.',
  data:data('episodic-country'),params:[parameter('hedSex','All')],transform:[{filter:'datum.sex === hedSex'}],
  encoding:{y:n('region',null,{sort:['Africa','Americas','Eastern Mediterranean','Europe','South-East Asia','Western Pacific'],axis:{labelLimit:140,labelFontSize:11}}),x:q('value','People aged 15+ (%)',{scale:{domain:[0,70]},axis:{tickCount:5,labelExpr:"datum.label + '%'"}})},
  layer:[
    {mark:{type:'boxplot',extent:'min-max',size:17,color:C.teal,box:{fillOpacity:.35,stroke:C.teal},median:{color:C.teal,strokeWidth:2},rule:{strokeWidth:1},ticks:{strokeWidth:1}},encoding:{tooltip:[tooltip('region','nominal','WHO region')]}},
    {transform:[{filter:"datum.iso3 === 'AUS'"}],mark:{type:'point',filled:true,color:C.rust,size:100,stroke:'#fffaf3',strokeWidth:1.5},encoding:{tooltip:[tooltip('sex','nominal','Australia, sex'),tooltip('value','quantitative','Prevalence (%)','.1f')]}},
    {transform:[{filter:"datum.iso3 === 'AUS'"}],mark:{type:'text',text:'Australia',align:'left',dx:9,dy:-13,color:C.rust,fontSize:11,fontWeight:600}}
  ]
},290);

add('availability', {
  description:'Published pure-alcohol supply per person aged15+, financial years1960–61 to2023–24. Availability is not individual reported consumption.',
  data:data('availability'),encoding:{x:q('year',null,{scale:{domain:[1960,2027]},axis:{format:'d',values:[1960,1970,1980,1990,2000,2010,2020],grid:false}}),y:q('value','Litres per person aged 15+',{scale:{domain:[0,15]},axis:{tickCount:5}})},
  layer:[
    {mark:{type:'area',color:C.teal,opacity:.09}},
    {mark:{type:'line',color:C.teal,strokeWidth:2.8}},
    {mark:{type:'point',opacity:0,size:110},encoding:{tooltip:[tooltip('period','nominal','Financial year'),tooltip('value','quantitative','Litres per person aged15+','.2f'),tooltip('volume','quantitative','Pure alcohol (thousand litres)',',.0f')]}},
    {transform:[{filter:'datum.year === 1974 || datum.year === 2023'}],mark:{type:'point',filled:true,size:65,color:C.teal}},
    {transform:[{filter:'datum.year === 1974'}],mark:{type:'text',text:'13.09 L · 1974–75 peak',align:'left',dx:10,dy:-15,fontSize:11,fontWeight:600,color:C.teal}},
    {transform:[{filter:'datum.year === 2023'}],mark:{type:'text',text:'9.79 L',align:'right',dx:-10,dy:-15,fontSize:12,fontWeight:700,color:C.teal}}
  ]
},320);

add('beverages', {
  description:'Shares of available pure alcohol by beverage,2011–12 to2023–24. Component volumes are normalised; source figures reconcile to the reported total within rounding.',
  data:data('beverage-mix'),mark:{type:'area',opacity:.9},
  encoding:{x:q('year',null,{axis:{format:'d',values:[2011,2014,2017,2020,2023],grid:false}}),y:q('share','Share of pure alcohol',{stack:'zero',scale:{domain:[0,1]},axis:{format:'.0%',tickCount:5}}),
    color:n('beverage',null,{scale:{domain:['Beer','Wine','Spirits & RTDs','Cider'],range:[C.gold,C.plum,C.teal,'#aca598']}}),order:{field:'order',type:'quantitative'},
    tooltip:[tooltip('period','nominal','Financial year'),tooltip('beverage','nominal','Beverage'),tooltip('share','quantitative','Share','.1%'),tooltip('volume','quantitative','Thousand litres of pure alcohol',',.0f')]}
},290);

add('age', {
  description:'NDSHS published drinking percentages by age and survey year. Each wave is a different population sample. Unreliable/suppressed observations are null.',
  data:data('age-trends'),params:[parameter('ageMeasure','More than 4 drinks monthly')],transform:[{filter:'datum.measure === ageMeasure'},{calculate:"datum.year === 2022 ? '2022–23' : toString(datum.year)",as:'short_period'}],
  mark:{type:'rect',stroke:'#fffaf3',strokeWidth:3,cornerRadius:2},
  encoding:{x:{field:'short_period',type:'ordinal',title:null,sort:{field:'year'},axis:{labelAngle:0,labelFontSize:10,grid:false}},
    y:{field:'age',type:'ordinal',title:null,sort:['14–17','18–24','25–29','30–39','40–49','50–59','60–69','70+'],axis:{grid:false}},
    color:q('value','People in the age group (%)',{scale:{domain:[0,65],range:['#f3ebda','#dfc89b','#b99a73','#986d60','#704d58','#49323f']},legend:{gradientLength:180}}),
    tooltip:[tooltip('age','nominal','Age'),tooltip('period','nominal','Survey year'),tooltip('measure','nominal','Measure'),tooltip('value','quantitative','Percentage','.1f'),tooltip('flag','nominal','Reliability'),tooltip('published_value','nominal','Published value')]}
},310);

add('adolescent', {
  description:'ASSAD Table2 weighted prevalence among secondary students12–17 in2022–23. Each square is one percentage point, with a fractional square preserving the precise percentage.',
  data:data('adolescent-waffle'),params:[parameter('studentGroup','All students'),parameter('studentMeasure','Past month')],transform:[{filter:'datum.group === studentGroup && datum.measure === studentMeasure'}],
  encoding:{x:q('x0',null,{scale:{domain:[0,10]},axis:null}),y:q('y0',null,{scale:{domain:[10,0]},axis:null}),x2:{field:'x1'},y2:{field:'y1'}},
  layer:[
    {transform:[{calculate:'datum.x0 + 0.86',as:'cellEnd'}],mark:{type:'rect',fill:C.pale,cornerRadius:2},encoding:{x2:{field:'cellEnd'},tooltip:[tooltip('group','nominal','Student group'),tooltip('measure','nominal','Drinking period'),tooltip('value','quantitative','Percentage','.1f')]}},
    {transform:[{filter:'datum.filled'}],mark:{type:'rect',fill:C.rust,cornerRadius:2},encoding:{tooltip:[tooltip('group','nominal','Student group'),tooltip('measure','nominal','Drinking period'),tooltip('value','quantitative','Percentage','.1f')]}}
  ]
},280);

add('gender', {
  description:'NHS2022 adult guideline exceedance by age and sex. Source-specific sex categories. The all-adult aggregate is deliberately excluded from the age plot.',
  data:data('adult-gap'),transform:[{filter:"datum.age !== 'All adults 18+' && isValid(datum.value)"}],
  encoding:{y:n('age',null,{sort:['18–24','25–34','35–44','45–54','55–64','65–74','75+'],axis:{grid:false}}),x:q('value','Adults exceeding the guideline (%)',{scale:{domain:[0,55]},axis:{tickCount:6,labelExpr:"datum.label + '%'"}})},
  layer:[
    {mark:{type:'rule',stroke:'#c9c0b5',strokeWidth:2},encoding:{x:{aggregate:'min',field:'value',type:'quantitative'},x2:{aggregate:'max',field:'value'}}},
    {mark:{type:'point',filled:true,size:85},encoding:{color:n('sex',null,{scale:sexScale}),tooltip:[tooltip('age','nominal','Age'),tooltip('sex','nominal','Sex'),tooltip('value','quantitative','Adults exceeding guideline (%)','.1f'),tooltip('flag','nominal','Reliability')]}},
    {transform:[{filter:"datum.sex === 'Males'"}],mark:{type:'text',align:'left',dx:9,fontSize:10,color:C.teal},encoding:{text:{field:'value',type:'quantitative',format:'.1f'}}},
    {transform:[{filter:"datum.sex === 'Females'"}],mark:{type:'text',align:'right',dx:-9,fontSize:10,color:C.plum},encoding:{text:{field:'value',type:'quantitative',format:'.1f'}}}
  ]
},310);

add('mosaic', {
  description:'NDSHS Table4.31 joint weekly/episodic-risk distribution. Areas are proportional to published shares, normalised only for rounding. Weekly categories follow explicit source row labels rather than reversed source footnotes.',
  data:data('risk-mosaic'),params:[parameter('mosaicGender','Persons')],transform:[{filter:'datum.gender === mosaicGender'},
    {calculate:'(datum.x0+datum.x1)/2',as:'cx'},{calculate:'(datum.y0+datum.y1)/2',as:'cy'},
    {calculate:"format(datum.value,'.1f') + '%'",as:'percentage_label'},
    {calculate:"datum.y1-datum.y0 < 18 ? format(datum.value,'.1f')+'%' : (datum.label === 'Both thresholds' ? 'Both\\nthresholds' : datum.label === 'Weekly only' ? 'Weekly\\nonly' : datum.label) + '\\n' + format(datum.value,'.1f') + '%'",as:'display'}],
  encoding:{x:q('x0',null,{scale:{domain:[0,100]},axis:null}),y:q('y0',null,{scale:{domain:[100,0]},axis:null})},
  layer:[
    {mark:{type:'rect',stroke:'#fffaf3',strokeWidth:4},encoding:{x2:{field:'x1'},y2:{field:'y1'},color:n('label',null,{scale:{domain:['No alcohol','Neither threshold','Episodic only','Weekly only','Both thresholds'],range:['#dfdbd2','#aac7c0',C.gold,C.plum,C.rust]},legend:{columns:2}}),
      tooltip:[tooltip('gender','nominal','Survey population'),tooltip('label','nominal','Category'),tooltip('value','quantitative','Population share (%)','.1f'),tooltip('weekly','nominal','Weekly threshold'),tooltip('episodic','nominal','Episodic threshold')]}},
    {mark:{type:'text',baseline:'middle',fontSize:11,fontWeight:600,lineBreak:'\n',lineHeight:13,dy:{expr:"(datum.y1-datum.y0) * height / 100 < 54 || (datum.x1-datum.x0) * width / 100 < 65 ? 0 : -(length(split(datum.display,'\\n'))-1)*13/2"},limit:{expr:'max(25, (datum.x1-datum.x0) * width / 100 - 12)'}},encoding:{x:{field:'cx',type:'quantitative'},y:{field:'cy',type:'quantitative'},text:{condition:{test:'(datum.y1-datum.y0) * height / 100 < 54 || (datum.x1-datum.x0) * width / 100 < 65',field:'percentage_label'},field:'display'},color:{condition:{test:"datum.label === 'Both thresholds' || datum.label === 'Weekly only'",value:'#fffaf3'},value:C.ink}}}
  ]
},300);

const tiles = [
  {state:'WA',col:0,row:1},{state:'NT',col:1,row:0},{state:'QLD',col:2,row:0},{state:'SA',col:1,row:1},
  {state:'NSW',col:2,row:1},{state:'ACT',col:3,row:1},{state:'VIC',col:2,row:2},{state:'TAS',col:2,row:3}
];
add('states', {
  description:'Equal-size tile cartogram with approximate Australian state arrangement. NDSHS2022–23 prevalence of exceeding the adult risk thresholds, people14+.',
  data:data('state-risk'),params:[parameter('stateGender','Persons')],transform:[{filter:'datum.gender === stateGender'},
    {lookup:'state',from:{data:{values:tiles},key:'state',fields:['col','row']}},
    {calculate:"format(datum.value,'.1f')+'%'",as:'display'}],
  encoding:{x:{field:'col',type:'ordinal',scale:{domain:[0,1,2,3],padding:.06},axis:null},y:{field:'row',type:'ordinal',scale:{domain:[0,1,2,3],padding:.06},axis:null}},
  layer:[
    {mark:{type:'rect',cornerRadius:2},encoding:{color:q('value','Risky drinking (%)',{scale:{domain:[0,60],range:['#efe7d6','#dfbc90','#be8b6e','#925e60','#664052']},legend:{gradientLength:160}}),tooltip:[tooltip('state_name','nominal','State or territory'),tooltip('gender','nominal','Population'),tooltip('value','quantitative','Risky drinking (%)','.1f'),tooltip('flag','nominal','Reliability')]}},
    {mark:{type:'text',fontSize:15,fontWeight:700,dy:-8},encoding:{text:{field:'state'},color:{condition:{test:'datum.value >= 40',value:'#fffaf3'},value:C.ink}}},
    {mark:{type:'text',fontSize:12,dy:13},encoding:{text:{field:'display'},color:{condition:{test:'datum.value >= 40',value:'#fffaf3'},value:C.ink}}}
  ]
},370);

const anchors=[
  {state:'WA',lon:122,lat:-26},{state:'NT',lon:133.5,lat:-19.5},{state:'SA',lon:135.5,lat:-31.5},
  {state:'QLD',lon:144.8,lat:-22},{state:'NSW',lon:146.8,lat:-32},{state:'VIC',lon:144.3,lat:-37.5},
  {state:'TAS',lon:146.7,lat:-42.1},{state:'ACT',lon:153,lat:-35.8}
];
add('treatment', {
  description:'Alcohol-principal-concern closed treatment episodes for own drug use by jurisdiction. Symbol area encodes episodes, not people or prevalence. ACT anchor offset with a leader for readability.',
  params:[parameter('treatmentYear',2024)],projection:{type:'mercator'},
  layer:[
    {data:{...data('australia.geo'),format:{type:'json',property:'features'}},mark:{type:'geoshape',fill:C.pale,stroke:'#fffaf3',strokeWidth:1}},
    {data:{values:[{lon:149.1,lat:-35.35,lon2:153,lat2:-35.8}]},mark:{type:'rule',color:C.grey,strokeWidth:1},encoding:{longitude:q('lon'),latitude:q('lat'),longitude2:{field:'lon2'},latitude2:{field:'lat2'}}},
    {data:data('treatment-states'),transform:[{filter:'datum.year === treatmentYear'},{lookup:'state',from:{data:{values:anchors},key:'state',fields:['lon','lat']}}],
      encoding:{longitude:q('lon'),latitude:q('lat')},layer:[
        {mark:{type:'circle',color:C.teal,opacity:.65,stroke:'#245a56',strokeWidth:1},encoding:{size:q('episodes','Closed treatment episodes',{scale:{domain:[0,30000],range:[0,3000]},legend:{values:[5000,15000,30000],format:'.2s'}}),tooltip:[tooltip('state_name','nominal','Reporting jurisdiction'),tooltip('period','nominal','Financial year'),tooltip('episodes','quantitative','Alcohol treatment episodes',',.0f')]}},
        {mark:{type:'text',fontSize:10,fontWeight:700,color:C.ink,dy:-3},encoding:{text:{field:'state'}}}
      ]}
  ]
},370);

add('hospital', {
  description:'NHMD2023–24 alcohol-principal-diagnosis hospitalisation episodes by published age/sex categories; counts not rates, and55+ is an open-ended band.',
  data:data('hospital-age-sex'),mark:{type:'bar',size:27,cornerRadiusEnd:2},
  encoding:{y:n('age',null,{sort:['15–24','25–34','35–44','45–54','55+'],axis:{grid:false}}),
    x:q('signed','Hospitalisation episodes',{scale:{domain:[-18000,18000]},axis:{values:[-15000,-10000,-5000,0,5000,10000,15000],labelExpr:"format(abs(datum.value),'.2s')"}}),
    color:n('sex',null,{scale:{domain:['Male','Female'],range:[C.teal,C.plum]}}),
    tooltip:[tooltip('age','nominal','Age'),tooltip('sex','nominal','Sex'),tooltip('count','quantitative','Episodes',',.0f'),tooltip('share_within_sex','quantitative','Share within sex (%)','.1f')]}
},290);

const diseaseDomain=['Alcohol use disorder','Injuries','Cancers','Cardiovascular diseases','Chronic liver disease','Not itemised in this extract'];
add('burden', {
  description:'ABDS2024 alcohol-attributable healthy life years lost. Child categories excluded; residual is explicitly total minus five listed major groups. Binary treemap layout precomputed proportional to values.',
  data:data('burden-treemap'),params:[parameter('burdenSex','All')],transform:[{filter:'datum.sex === burdenSex'},
    {calculate:"datum.disease === 'Cardiovascular diseases' ? 'Cardiovascular\\ndiseases' : datum.disease === 'Not itemised in this extract' ? 'Not\\nitemised' : datum.disease === 'Chronic liver disease' ? (datum.share < 0.04 ? 'Liver' : 'Liver\\ndisease') : datum.disease === 'Alcohol use disorder' ? 'Alcohol use\\ndisorder' : datum.disease",as:'short'},
    {calculate:"datum.short + '\\n' + format(datum.value,',')",as:'display'}],
  encoding:{x:q('x0',null,{scale:{domain:[0,1]},axis:null}),y:q('y0',null,{scale:{domain:[1,0]},axis:null})},
  layer:[
    {mark:{type:'rect',stroke:'#fffaf3',strokeWidth:4},encoding:{x2:{field:'x1'},y2:{field:'y1'},color:n('disease',null,{scale:{domain:diseaseDomain,range:[C.plum,C.rust,C.gold,C.teal,'#799595','#c4beb5']},legend:null}),tooltip:[tooltip('disease','nominal','Disease group'),tooltip('value','quantitative','Healthy life years lost',',.0f'),tooltip('share','quantitative','Share of alcohol burden','.1%'),tooltip('attributable_percent','quantitative','Share of this disease due to alcohol (%)','.1f'),tooltip('derived','nominal','Derived remainder')]}},
    {mark:{type:'text',fontSize:{expr:'(datum.x1 - datum.x0) * width < 70 ? 9 : datum.share < 0.17 ? 10 : 12'},fontWeight:600,lineBreak:'\n',lineHeight:14,limit:{expr:'max(28, (datum.x1 - datum.x0) * width - 10)'}},encoding:{x:{field:'cx',type:'quantitative'},y:{field:'cy',type:'quantitative'},text:{condition:{test:'(datum.x1 - datum.x0) * width < 58',field:'value',type:'quantitative',format:',.0f'},field:'display'},color:{condition:{test:"datum.disease === 'Cancers' || datum.disease === 'Not itemised in this extract'",value:C.ink},value:'#fffaf3'}}}
  ]
},310);

add('mortality', {
  description:'Accounting waterfall of year-to-year changes in registered alcohol-induced death counts2015–2024. Recent data provisional. These deltas are not causal explanations.',
  data:data('death-waterfall'),params:[parameter('mortalitySex','All')],transform:[{filter:'datum.sex === mortalitySex'},
    {calculate:'max(datum.start,datum.end)',as:'top'}],
  encoding:{x:{field:'step',type:'ordinal',sort:{field:'order'},title:null,axis:{labelAngle:0,labelFontSize:10,labelExpr:"replace(datum.label,' total','')",grid:false}},y:q('start','Registered alcohol-induced deaths',{scale:{domain:[0,2100]},axis:{tickCount:5}})},
  layer:[
    {mark:{type:'bar',cornerRadiusEnd:2},encoding:{y2:{field:'end'},color:n('kind',null,{scale:{domain:['Total','Increase','Decrease'],range:[C.ink,C.rust,C.teal]},legend:{orient:'top'}}),tooltip:[tooltip('step','nominal','Year / total'),tooltip('count','quantitative','Registered deaths',',.0f'),tooltip('change','quantitative','Change or total',',.0f'),tooltip('rate','quantitative','Age-standardised rate per100,000','.1f'),tooltip('status','nominal','Revision status')]}},
    {mark:{type:'text',dy:-9,fontSize:10,fontWeight:600},encoding:{y:{field:'top',type:'quantitative'},text:{field:'label'}}}
  ]
},330);

for (const [id,spec] of Object.entries(specs)) {
  await fs.writeFile(path.join(output,`${id}.vl.json`),JSON.stringify(spec,null,2)+'\n');
}
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(Object.keys(specs),null,2)+'\n');
console.log(`Wrote ${Object.keys(specs).length} standalone Vega-Lite specifications.`);
