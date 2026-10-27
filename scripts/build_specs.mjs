import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {palette as C, genderScale, categoryScale} from './chart_palette.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'site/specs');
await fs.mkdir(output, {recursive: true});
// All plot text shares the page's 12px note size. Fit labels by shortening
// their content rather than introducing smaller type sizes.
const CHART_TEXT_SIZE = 12;
const config = {
  background:null, font:'Arial', view:{stroke:null},
  axis:{labelFont:'Arial',titleFont:'Arial',labelFontSize:CHART_TEXT_SIZE,titleFontSize:CHART_TEXT_SIZE,titleFontWeight:400,labelColor:'#625c61',titleColor:'#625c61',domain:false,tickColor:'#ddd4c6',gridColor:'#e5ded3',gridOpacity:.8,titlePadding:13,labelPadding:7},
  legend:{labelFont:'Arial',titleFont:'Arial',labelFontSize:CHART_TEXT_SIZE,titleFontSize:CHART_TEXT_SIZE,titleFontWeight:400,labelColor:'#625c61',titleColor:'#625c61',orient:'bottom',padding:10,offset:16},
  title:{font:'Arial',fontSize:CHART_TEXT_SIZE,color:C.ink}, text:{font:'Arial',fontSize:CHART_TEXT_SIZE,color:C.ink},
};
const data = name => ({url:`data/${name}.json`});
const q = (field,title,extra={}) => ({field,type:'quantitative',title,...extra});
const n = (field,title,extra={}) => ({field,type:'nominal',title,...extra});
const tooltip = (field,type,title,format) => ({field,type,title,...(format?{format}:{})});
const sexScale = genderScale(true);
const parameter = (name,value) => ({name,value});
const specs = {};
function add(id,spec,height=310) {
  specs[id] = {$schema:'https://vega.github.io/schema/vega-lite/v6.json',description:spec.description,
    width:'container',height,autosize:{type:'fit',contains:'padding',resize:true},padding:0,config,...spec};
}

add('world', {
  description:'World Health Organization estimated litres of pure alcohol per person aged15+; three-year-average indicator. Country geometry is Natural Earth. Grey means no matched estimate.',
  params:[parameter('mapYear',2024)], projection:{type:'equalEarth'},
  layer:[
    {data:{...data('world.geo'),format:{type:'json',property:'features'}},mark:{type:'geoshape',fill:C.missing,stroke:C.paper,strokeWidth:.55},encoding:{tooltip:[tooltip('properties.name','nominal','Country')] }},
    {data:data('world-consumption'),transform:[{filter:'datum.year === mapYear'},
      {lookup:'iso3',from:{data:{...data('world.geo'),format:{type:'json',property:'features'}},key:'properties.iso3',fields:['geometry','properties.name']},as:['geometry','name']},
      {filter:'isValid(datum.geometry)'}],
      mark:{type:'geoshape',stroke:'#fffaf3',strokeWidth:.55},encoding:{shape:{field:'geometry',type:'geojson'},
        color:q('value','Litres of pure alcohol per person aged 15+',{scale:{domain:[0,15],range:C.magnitude,clamp:true},legend:{gradientLength:220,values:[0,3,6,9,12,15],labelExpr:"datum.value >= 15 ? '15+' : datum.label"}}),
        tooltip:[tooltip('name','nominal','Country'),tooltip('year','ordinal','Estimate year'),tooltip('value','quantitative','Litres per adult','.1f'),tooltip('lower','quantitative','Lower estimate','.1f'),tooltip('upper','quantitative','Upper estimate','.1f')]}},
    {data:{...data('world.geo'),format:{type:'json',property:'features'}},transform:[{filter:"datum.properties.iso3 === 'AUS'"}],mark:{type:'geoshape',fill:null,stroke:C.ink,strokeWidth:1.5}}
  ]
},390);

add('episodic', {
  description:'Distribution of country-level heavy episodic drinking prevalence by World Health Organization region,2020. Each country contributes one observation. The boxes are not individual drinking distributions.',
  data:data('episodic-country'),params:[parameter('hedSex','All')],transform:[{filter:'datum.sex === hedSex'},
    {joinaggregate:[{op:'valid',field:'value',as:'countries'},{op:'median',field:'value',as:'median'},
      {op:'q1',field:'value',as:'q1'},{op:'q3',field:'value',as:'q3'},
      {op:'min',field:'value',as:'minimum'},{op:'max',field:'value',as:'maximum'}],groupby:['region']}],
  encoding:{y:n('region',null,{sort:['Africa','Americas','Eastern Mediterranean','Europe','South-East Asia','Western Pacific'],axis:{labelLimit:140,labelFontSize:CHART_TEXT_SIZE}}),x:q('value','People aged 15+ (%)',{scale:{domain:[0,70]},axis:{tickCount:5,labelExpr:"datum.label + '%'"}})},
  layer:[
    {mark:{type:'boxplot',extent:'min-max',size:17,color:C.series,box:{fillOpacity:.2,stroke:C.series},median:{color:C.series,strokeWidth:2},rule:{strokeWidth:1},ticks:{strokeWidth:1}},encoding:{tooltip:[tooltip('region','nominal','World Health Organization region'),tooltip('countries','quantitative','Countries'),tooltip('median','quantitative','Median (%)','.1f'),tooltip('q1','quantitative','Lower quartile (%)','.1f'),tooltip('q3','quantitative','Upper quartile (%)','.1f'),tooltip('minimum','quantitative','Minimum (%)','.1f'),tooltip('maximum','quantitative','Maximum (%)','.1f')]}},
    {transform:[{filter:"datum.iso3 === 'AUS'"}],mark:{type:'point',shape:'diamond',filled:true,color:C.paper,size:120,stroke:C.ink,strokeWidth:2},encoding:{tooltip:[tooltip('sex','nominal','Australia, sex'),tooltip('value','quantitative','Prevalence (%)','.1f')]}},
    {transform:[{filter:"datum.iso3 === 'AUS'"}],mark:{type:'text',text:'Australia',align:'left',dx:9,dy:-13,color:C.ink,fontSize:CHART_TEXT_SIZE,fontWeight:600}}
  ]
},290);

add('availability', {
  description:'Published pure-alcohol supply per person aged15+, financial years1960–61 to2023–24. Availability is not individual reported consumption.',
  data:data('availability'),encoding:{x:q('year',null,{scale:{domain:[1960,2027]},axis:{format:'d',values:[1960,1970,1980,1990,2000,2010,2020],grid:false}}),y:q('value','Litres per person aged 15+',{scale:{domain:[0,15]},axis:{tickCount:5}})},
  layer:[
    {name:'availability_area',mark:{type:'area',color:C.series,opacity:.09}},
    {name:'availability_line',mark:{type:'line',color:C.series,strokeWidth:2.8}},
    {name:'availability_hover',mark:{type:'point',opacity:0,size:110},encoding:{tooltip:[tooltip('period','nominal','Financial year'),tooltip('value','quantitative','Litres per person aged15+','.2f'),tooltip('volume','quantitative','Pure alcohol (thousand litres)',',.0f')]}},
    {name:'availability_focus',transform:[{filter:'datum.year === 1974 || datum.year === 2023'}],mark:{type:'point',filled:true,size:65,color:C.series}},
    {name:'availability_peak',transform:[{filter:'datum.year === 1974'}],mark:{type:'text',text:'13.09 L · 1974–75 peak',align:'left',dx:10,dy:-15,fontSize:CHART_TEXT_SIZE,fontWeight:600,color:C.series}},
    {name:'availability_latest',transform:[{filter:'datum.year === 2023'}],mark:{type:'text',text:'9.79 L',align:'right',dx:-10,dy:-15,fontSize:CHART_TEXT_SIZE,fontWeight:700,color:C.series}}
  ]
},320);

add('beverages', {
  description:'Shares of available pure alcohol by beverage,2011–12 to2023–24. Component volumes are normalised; source figures reconcile to the reported total within rounding.',
  data:data('beverage-mix'),
  encoding:{x:q('year',null,{axis:{format:'d',values:[2011,2014,2017,2020,2023],grid:false}}),y:q('share','Share of pure alcohol',{stack:'zero',scale:{domain:[0,1]},axis:{format:'.0%',tickCount:5}}),
    color:n('beverage',null,{scale:categoryScale(C.beverage)}),order:{field:'order',type:'quantitative'},
    tooltip:[tooltip('period','nominal','Financial year'),tooltip('beverage','nominal','Beverage'),tooltip('share','quantitative','Share','.1%'),tooltip('volume','quantitative','Thousand litres of pure alcohol',',.0f')]},
  layer:[
    {mark:{type:'area',opacity:1,stroke:C.paper,strokeWidth:1}},
    {transform:[{filter:'datum.year === 2023'},
      {stack:'share',groupby:['year'],sort:[{field:'order',order:'ascending'}],as:['lo','hi']},
      {calculate:'(datum.lo+datum.hi)/2',as:'mid'},
      {calculate:"(datum.beverage === 'Spirits & RTDs' ? 'Spirits / RTDs' : datum.beverage) + ' ' + format(datum.share,'.0%')",as:'label'},
      {filter:'datum.share >= 0.05'}],
      mark:{type:'text',align:'right',dx:-6,fontSize:CHART_TEXT_SIZE,fontWeight:600},
      encoding:{y:q('mid',null,{stack:null}),text:{field:'label'},color:{condition:{test:"datum.beverage === 'Wine' || datum.beverage === 'Spirits & RTDs'",value:C.paper},value:C.ink}}}
  ]
},290);

add('age', {
  description:'National Drug Strategy Household Survey published drinking percentages by age and survey year. Each wave is a different population sample. Unreliable/suppressed observations are null.',
  data:data('age-trends'),params:[parameter('ageMeasure','More than 4 drinks monthly')],transform:[{filter:'datum.measure === ageMeasure'},{calculate:"datum.year === 2022 ? '2022–23' : toString(datum.year)",as:'short_period'}],
  mark:{type:'rect',stroke:'#fffaf3',strokeWidth:3,cornerRadius:2},
  encoding:{x:{field:'short_period',type:'ordinal',title:null,sort:{field:'year'},axis:{labelAngle:0,labelFontSize:CHART_TEXT_SIZE,grid:false}},
    y:{field:'age',type:'ordinal',title:null,sort:['14–17','18–24','25–29','30–39','40–49','50–59','60–69','70+'],axis:{grid:false}},
    color:q('value','People in the age group (%)',{scale:{domain:[0,60],range:C.magnitude},legend:{gradientLength:180}}),
    tooltip:[tooltip('age','nominal','Age'),tooltip('period','nominal','Survey year'),tooltip('measure','nominal','Measure'),tooltip('value','quantitative','Percentage','.1f'),tooltip('flag','nominal','Reliability'),tooltip('published_value','nominal','Published value')]}
},310);

add('adolescent', {
  description:'Australian Secondary Students’ Alcohol and Drug Survey Table2 weighted prevalence among secondary students12–17 in2022–23. Each square is one percentage point, with a fractional square preserving the precise percentage.',
  data:data('adolescent-waffle'),params:[parameter('studentGroup','All students'),parameter('studentMeasure','Past month')],transform:[{filter:'datum.group === studentGroup && datum.measure === studentMeasure'}],
  encoding:{x:q('x0',null,{scale:{domain:[0,10]},axis:null}),y:q('y0',null,{scale:{domain:[10,0]},axis:null}),x2:{field:'x1'},y2:{field:'y1'}},
  layer:[
    {transform:[{calculate:'datum.x0 + 0.86',as:'cellEnd'}],mark:{type:'rect',fill:C.pale,cornerRadius:2},encoding:{x2:{field:'cellEnd'},tooltip:[tooltip('group','nominal','Student group'),tooltip('measure','nominal','Drinking period'),tooltip('value','quantitative','Percentage','.1f')]}},
    {transform:[{filter:'datum.filled'}],mark:{type:'rect',fill:C.series,cornerRadius:2},encoding:{tooltip:[tooltip('group','nominal','Student group'),tooltip('measure','nominal','Drinking period'),tooltip('value','quantitative','Percentage','.1f')]}}
  ]
},280);

add('gender', {
  description:'National Health Survey 2022 adult guideline exceedance by age and sex. Source-specific sex categories. The all-adult aggregate is deliberately excluded from the age plot.',
  data:data('adult-gap'),transform:[{filter:"datum.age !== 'All adults 18+' && isValid(datum.value)"}],
  encoding:{y:n('age',null,{sort:['18–24','25–34','35–44','45–54','55–64','65–74','75+'],axis:{grid:false}}),x:q('value','Adults exceeding the guideline (%)',{scale:{domain:[0,55]},axis:{tickCount:6,labelExpr:"datum.label + '%'"}})},
  layer:[
    {mark:{type:'rule',stroke:'#c9c0b5',strokeWidth:2},encoding:{x:{aggregate:'min',field:'value',type:'quantitative'},x2:{aggregate:'max',field:'value'}}},
    {mark:{type:'point',filled:true,size:85},encoding:{color:n('sex',null,{scale:sexScale}),shape:n('sex',null,{scale:{domain:['Males','Females'],range:['circle','square']}}),tooltip:[tooltip('age','nominal','Age'),tooltip('sex','nominal','Sex'),tooltip('value','quantitative','Adults exceeding guideline (%)','.1f'),tooltip('flag','nominal','Reliability')]}},
    {transform:[{filter:"datum.sex === 'Males'"}],mark:{type:'text',align:'left',dx:9,fontSize:CHART_TEXT_SIZE,color:C.gender.Male},encoding:{text:{field:'value',type:'quantitative',format:'.1f'}}},
    {transform:[{filter:"datum.sex === 'Females'"}],mark:{type:'text',align:'right',dx:-9,fontSize:CHART_TEXT_SIZE,color:C.gender.Female},encoding:{text:{field:'value',type:'quantitative',format:'.1f'}}}
  ]
},310);

add('mosaic', {
  description:'National Drug Strategy Household Survey Table4.31 joint weekly/episodic-risk distribution. Areas are proportional to published shares, normalised only for rounding. Weekly categories follow explicit source row labels rather than reversed source footnotes.',
  padding:{top:30,bottom:0,left:0,right:0},
  data:data('risk-mosaic'),params:[parameter('mosaicGender','Persons')],transform:[{filter:'datum.gender === mosaicGender'},
    {calculate:'(datum.x0+datum.x1)/2',as:'cx'},{calculate:'(datum.y0+datum.y1)/2',as:'cy'},
    {calculate:"format(datum.value,'.1f') + '%'",as:'percentage_label'},
    {calculate:"datum.y1-datum.y0 < 18 ? format(datum.value,'.1f')+'%' : (datum.label === 'No alcohol' ? 'No\\nalcohol' : datum.label === 'Both thresholds' ? 'Both\\nthresholds' : datum.label === 'Weekly only' ? 'Weekly\\nonly' : datum.label) + '\\n' + format(datum.value,'.1f') + '%'",as:'display'}],
  encoding:{x:q('x0',null,{scale:{domain:[0,100]},axis:null}),y:q('y0',null,{scale:{domain:[100,0]},axis:null})},
  layer:[
    {mark:{type:'rect',stroke:C.rule,strokeWidth:2},encoding:{x2:{field:'x1'},y2:{field:'y1'},color:n('label',null,{scale:categoryScale(C.pattern),legend:{columns:2,symbolStrokeColor:C.rule}}),
      tooltip:[tooltip('gender','nominal','Survey population'),tooltip('label','nominal','Category'),tooltip('value','quantitative','Population share (%)','.1f'),tooltip('weekly','nominal','Weekly threshold'),tooltip('episodic','nominal','Episodic threshold')]}},
    {mark:{type:'text',baseline:'middle',fontSize:CHART_TEXT_SIZE,fontWeight:600,lineBreak:'\n',lineHeight:16,dy:{expr:"(datum.y1-datum.y0) * height / 100 < 54 || (datum.x1-datum.x0) * width / 100 < 65 ? 0 : -(length(split(datum.display,'\\n'))-1)*16/2"},limit:{expr:'max(25, (datum.x1-datum.x0) * width / 100 - 12)'}},encoding:{x:{field:'cx',type:'quantitative'},y:{field:'cy',type:'quantitative'},text:{condition:{test:'(datum.y1-datum.y0) * height / 100 < 54 || (datum.x1-datum.x0) * width / 100 < 65',field:'percentage_label'},field:'display'},color:{condition:{test:"datum.label === 'Both thresholds' || datum.label === 'Weekly only'",value:C.paper},value:C.ink}}},
    {transform:[{filter:"indexof(['No alcohol','Neither threshold','Weekly only'], datum.label) >= 0"},
      {calculate:"datum.label === 'No alcohol' ? 'Abstain' : datum.label === 'Neither threshold' ? '≤10/week' : '>10/week'",as:'heading'}],
      mark:{type:'text',baseline:'bottom',dy:-9,fontSize:CHART_TEXT_SIZE,fontWeight:600,limit:{expr:'(datum.x1-datum.x0) * width / 100 - 4'}},
      encoding:{x:q('cx',null),y:{datum:0,type:'quantitative'},text:{field:'heading'},color:{value:C.ink}}}
  ]
},330);

const tiles = [
  {state:'WA',col:0,row:1},{state:'NT',col:1,row:0},{state:'QLD',col:2,row:0},{state:'SA',col:1,row:1},
  {state:'NSW',col:2,row:1},{state:'ACT',col:3,row:1},{state:'VIC',col:2,row:2},{state:'TAS',col:2,row:3}
];
add('states', {
  description:'Equal-size tile cartogram with approximate Australian state arrangement. National Drug Strategy Household Survey 2022–23 prevalence of exceeding the adult risk thresholds, people14+.',
  data:data('state-risk'),params:[parameter('stateGender','Persons')],transform:[{filter:'datum.gender === stateGender'},
    {lookup:'state',from:{data:{values:tiles},key:'state',fields:['col','row']}},
    {calculate:"format(datum.value,'.1f')+'%'",as:'display'}],
  encoding:{x:{field:'col',type:'ordinal',scale:{domain:[0,1,2,3],padding:.06},axis:null},y:{field:'row',type:'ordinal',scale:{domain:[0,1,2,3],padding:.06},axis:null}},
  layer:[
    {mark:{type:'rect',cornerRadius:2},encoding:{color:q('value','Risky drinking (%)',{scale:{domain:[0,60],range:C.magnitude},legend:{gradientLength:160}}),tooltip:[tooltip('state_name','nominal','State or territory'),tooltip('gender','nominal','Population'),tooltip('value','quantitative','Risky drinking (%)','.1f'),tooltip('flag','nominal','Reliability')]}},
    {mark:{type:'text',fontSize:CHART_TEXT_SIZE,fontWeight:700,dy:-8,aria:false,stroke:C.paper,strokeWidth:3,color:C.paper},encoding:{text:{field:'state'}}},
    {mark:{type:'text',fontSize:CHART_TEXT_SIZE,fontWeight:700,dy:-8,color:C.ink},encoding:{text:{field:'state'}}},
    {mark:{type:'text',fontSize:CHART_TEXT_SIZE,dy:13,aria:false,stroke:C.paper,strokeWidth:3,color:C.paper},encoding:{text:{field:'display'}}},
    {mark:{type:'text',fontSize:CHART_TEXT_SIZE,dy:13,color:C.ink},encoding:{text:{field:'display'}}}
  ]
},370);

const anchors=[
  {state:'WA',lon:122,lat:-26,label_lon:117.5,label_lat:-26},
  {state:'NT',lon:133.5,lat:-19.5,label_lon:133.5,label_lat:-16.2},
  {state:'SA',lon:135.5,lat:-31.5,label_lon:130.3,label_lat:-32.3},
  {state:'QLD',lon:144.8,lat:-22,label_lon:149.3,label_lat:-21.6},
  {state:'NSW',lon:146.8,lat:-32,label_lon:152,label_lat:-30},
  {state:'VIC',lon:144.3,lat:-37.5,label_lon:140.2,label_lat:-38.7},
  {state:'TAS',lon:146.7,lat:-42.1,label_lon:150.5,label_lat:-42.4},
  {state:'ACT',lon:153,lat:-35.8,label_lon:156,label_lat:-35.5}
];
const treatmentLabelEncoding={longitude:q('label_lon'),latitude:q('label_lat'),text:{field:'label'}};
const treatmentLabelMark={type:'text',fontSize:CHART_TEXT_SIZE,fontWeight:600,lineBreak:'\n',lineHeight:16,baseline:'middle',dy:-8};
add('treatment', {
  description:'Alcohol-principal-concern closed treatment episodes for own drug use by jurisdiction. Symbol area encodes episodes, not people or prevalence. ACT anchor offset with a leader for readability.',
  params:[parameter('treatmentYear',2024)],projection:{type:'mercator'},
  layer:[
    {data:{...data('australia.geo'),format:{type:'json',property:'features'}},mark:{type:'geoshape',fill:C.pale,stroke:'#fffaf3',strokeWidth:1.2}},
    {data:{values:[{lon:149.1,lat:-35.35,lon2:153,lat2:-35.8}]},mark:{type:'rule',color:C.rule,strokeWidth:1},encoding:{longitude:q('lon'),latitude:q('lat'),longitude2:{field:'lon2'},latitude2:{field:'lat2'}}},
    {data:{values:anchors},mark:{type:'rule',color:'#807c72',strokeWidth:1,opacity:.6},encoding:{longitude:q('lon'),latitude:q('lat'),longitude2:{field:'label_lon'},latitude2:{field:'label_lat'}}},
    {data:data('treatment-states'),transform:[{filter:'datum.year === treatmentYear'},{lookup:'state',from:{data:{values:anchors},key:'state',fields:['lon','lat','label_lon','label_lat']}},{calculate:"datum.state + '\\n' + format(datum.episodes,',.0f')",as:'label'}],
      encoding:{longitude:q('lon'),latitude:q('lat')},layer:[
        {mark:{type:'circle',color:C.series,opacity:.85,stroke:C.paper,strokeWidth:2},encoding:{size:q('episodes','Closed treatment episodes',{scale:{domain:[0,30000],range:[0,1900]},legend:{values:[5000,15000,30000],format:',.0f'}}),tooltip:[tooltip('state_name','nominal','Reporting jurisdiction'),tooltip('period','nominal','Financial year'),tooltip('episodes','quantitative','Alcohol treatment episodes',',.0f')]}},
        {mark:{...treatmentLabelMark,aria:false,color:C.paper,stroke:C.paper,strokeWidth:3},encoding:treatmentLabelEncoding},
        {mark:{...treatmentLabelMark,color:C.ink},encoding:treatmentLabelEncoding}
      ]}
  ]
},370);

add('hospital', {
  description:'Tornado chart of National Hospital Morbidity Database hospitalisation episodes, 2023–24: males extend left and females right from zero. Signed positions mirror positive counts; labels and tooltips show actual episode counts. The 55+ band is open-ended.',
  data:data('hospital-age-sex'),
  transform:[{calculate:"datum.sex === 'Male' ? -datum.count : datum.count",as:'position'}],
  encoding:{y:n('age',null,{sort:['15–24','25–34','35–44','45–54','55+'],axis:{grid:false}}),
    x:q('position','Hospitalisation episodes',{scale:{domain:[-26000,26000]},axis:{values:[-20000,-10000,0,10000,20000],labelExpr:"format(abs(datum.value),',.0f')"}})},
  layer:[
    {mark:{type:'bar',size:26},encoding:{x2:{datum:0},color:n('sex',null,{scale:genderScale(),legend:{orient:'top',title:'Male: left · Female: right'}}),
      tooltip:[tooltip('age','nominal','Age'),tooltip('sex','nominal','Sex'),tooltip('count','quantitative','Episodes',',.0f'),tooltip('share_within_sex','quantitative','Share within sex (%)','.1f')]}},
    {data:{values:[{}]},mark:{type:'rule',color:C.rule,strokeWidth:1},encoding:{x:{datum:0},y:{value:0},y2:{value:{expr:'height'}}}},
    {transform:[{filter:"datum.sex === 'Male'"}],mark:{type:'text',align:'right',dx:-5,fontSize:CHART_TEXT_SIZE,color:C.ink},encoding:{text:{field:'count',type:'quantitative',format:',.0f'}}},
    {transform:[{filter:"datum.sex === 'Female'"}],mark:{type:'text',align:'left',dx:5,fontSize:CHART_TEXT_SIZE,color:C.ink},encoding:{text:{field:'count',type:'quantitative',format:',.0f'}}}
  ]
},350);

add('burden', {
  description:'Ranked horizontal bars of Australian Burden of Disease Study 2024 alcohol-attributable healthy life years lost. All populations use the same positive count scale. The labelled residual is total minus five listed major groups; no disease allocation is invented.',
  data:data('burden-treemap'),params:[parameter('burdenSex','All')],transform:[{filter:'datum.sex === burdenSex'},
    {calculate:"datum.disease === 'Cardiovascular diseases' ? 'Cardiovascular\\ndiseases' : datum.disease === 'Not itemised in this extract' ? 'Not itemised\\n(derived residual)' : datum.disease === 'Chronic liver disease' ? 'Chronic liver\\ndisease' : datum.disease === 'Alcohol use disorder' ? 'Alcohol use\\ndisorder' : datum.disease",as:'category'},
    {calculate:"format(datum.value,',.0f') + ' · ' + format(datum.share,'.1%')",as:'display'},
    {calculate:"datum.derived ? 'Total minus the five listed groups' : 'Published disease group'",as:'derivation'},
    {calculate:"isValid(datum.attributable_percent) ? format(datum.attributable_percent,'.1f') + '%' : 'Not itemised'",as:'attributionLabel'}],
  encoding:{x:q('value','Healthy life years lost',{scale:{domain:[0,110000]},axis:{values:[0,25000,50000,75000,100000],labelExpr:"datum.value === 0 ? '0' : format(datum.value,'.2s')"}}),
    y:n('category',null,{sort:{field:'value',op:'max',order:'descending'},axis:{labelLimit:130,labelLineHeight:15,labelPadding:8,labelExpr:"split(datum.label,'\\n')"}})},
  layer:[
    {mark:{type:'bar',size:26,cornerRadiusEnd:2,stroke:C.series,strokeWidth:.6},encoding:{color:{condition:{test:"datum.disease === 'Not itemised in this extract'",value:C.residual},value:C.series},tooltip:[tooltip('disease','nominal','Disease group'),tooltip('sex','nominal','Population'),tooltip('value','quantitative','Healthy life years lost',',.0f'),tooltip('share','quantitative','Share of alcohol burden','.1%'),tooltip('attributionLabel','nominal','Share of this disease due to alcohol'),tooltip('derivation','nominal','Value type')]}},
    {mark:{type:'text',fontSize:CHART_TEXT_SIZE,align:'left',dx:6,color:C.ink},encoding:{text:{condition:{test:'width >= 280',field:'display'},field:'value',type:'quantitative',format:',.0f'}}}
  ]
},350);

add('mortality', {
  description:'Accounting waterfall of year-to-year changes in registered alcohol-induced death counts2015–2024. Recent data provisional. These deltas are not causal explanations.',
  data:data('death-waterfall'),params:[parameter('mortalitySex','All')],transform:[{filter:'datum.sex === mortalitySex'},
    {calculate:'max(datum.start,datum.end)',as:'top'}],
  encoding:{x:{field:'step',type:'ordinal',sort:{field:'order'},title:null,axis:{labelAngle:0,labelFontSize:CHART_TEXT_SIZE,labelExpr:"datum.label === '2024' ? ['2024','change'] : indexof(datum.label,'total') >= 0 ? split(datum.label,' ') : datum.label",labelLineHeight:15,grid:false}},y:q('start','Registered alcohol-induced deaths',{scale:{domain:[0,2100]},axis:{tickCount:5}})},
  layer:[
    {name:'mortality_bars',mark:{type:'bar',cornerRadiusEnd:2},encoding:{y2:{field:'end'},color:n('kind',null,{scale:categoryScale(C.change),legend:{orient:'top'}}),tooltip:[tooltip('step','nominal','Year / total'),tooltip('count','quantitative','Registered deaths',',.0f'),tooltip('change','quantitative','Change or total',',.0f'),tooltip('rate','quantitative','Age-standardised rate per100,000','.1f'),tooltip('status','nominal','Revision status')]}},
    {name:'mortality_labels',mark:{type:'text',dy:-9,fontSize:CHART_TEXT_SIZE,fontWeight:600},encoding:{y:{field:'top',type:'quantitative'},text:{field:'label'}}}
  ]
},330);

for (const [id,spec] of Object.entries(specs)) {
  await fs.writeFile(path.join(output,`${id}.vl.json`),JSON.stringify(spec,null,2)+'\n');
}
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(Object.keys(specs),null,2)+'\n');
await fs.writeFile(path.join(root,'site/data/colour-system.json'),JSON.stringify(C,null,2)+'\n');
console.log(`Wrote ${Object.keys(specs).length} standalone Vega-Lite specifications.`);
