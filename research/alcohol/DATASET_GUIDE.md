# Alcohol consumption: dataset research and Vega-Lite story plan

Research date: 13 October 2026. Brief read in full: FIT3179 Data Visualisation 2, version 1.2, six pages. This is a research and design deliverable, not a completed website. The user's preference is to select data for the story without tailoring it to a campus audience.

## Recommended scope and central question

**A changing drinking culture: who drinks, how habits have changed, and where harm remains.**

Use the world as context and Australia as the detailed case study. The Australian sources provide a consistent geographical setting, decades of history, age and sex/gender comparisons, state differences and independently collected measures of consequences. This is a recommendation made during research; the user has not selected Australia explicitly.

The central question is: **When average drinking changes, do all population groups change together?** Investigate the answer through age, gender, beverage preferences and geography, then explain why consumption and harm need separate measures. Do not assume that a decline in consumption immediately causes a decline in hospitalisations or deaths.

These are **10 distinct published data products from several providers**, not 10 independent surveys. WHO products D01 and D02 belong to the same information system. All NDSHS national and state workbooks are counted together as D03; multiple treatment workbooks are counted together as D08. Geography files needed for maps are supporting assets, not extra alcohol datasets.

## What the assessment actually rewards

The rubric starts on PDF page 5 and continues on page 6. Its weights add to 25 percentage points of the unit mark.

| Criterion | Weight | Consequence for this project |
|---|---:|---|
| Sketch | 2% | HD specifies four or more clear sections with varied, detailed charts and maps. A digitally created sketch receives zero for this component; use the required hand-drawn sketch. |
| Idioms and complexity | 8% | HD specifies at least eight advanced idioms across **more than ten charts**. Include three **different map idioms**. Fewer than three map idioms caps this component at 4%. |
| Layout, colour and figure-ground | 3% | Organise a clear visual hierarchy with aligned rows/columns, consistent colour and useful white space. |
| Typography | 2% | Use readable text, appropriate hierarchy, line length and spacing, with a topic-appropriate typeface. |
| Storytelling, annotations and writing | 5% | Build a logical sequence, annotate substantive findings and include complete sources, authorship and dates. |
| Domain, who, what, why and how | 2% | Explain the data, reader's tasks, purpose and reasons for each chart choice. |
| Interview | 3% | Understand the definitions, transformations, chart choices and interactions well enough to explain them. |

Other requirements: minimum ten charts; small multiples or a series of similar charts count as one; data from at least two different sources; latest available data; a single scrollable GitHub page; readable JSON specifications in the same repository; no horizontal scrolling on a small laptop; downloadable runtime data less than a few megabytes; purposeful interaction; attribution and acknowledgement of AI assistance. The brief gives a deadline of 25 October 2026 at 11:55 PM, without explicitly identifying the timezone.

Ten datasets are the user's requested research scope. They are not a substitute for the chart, map and storytelling requirements. No dataset selection by itself guarantees a grade.

## The ten datasets

### D01 — WHO total alcohol consumption per adult

- **Owner/product:** WHO Global Health Observatory, indicator `SA_0000001688`, total per-capita consumption for ages 15+, three-year average.
- **Verified coverage:** the live endpoint returned 5,175 country/territory rows, 207 location codes per year, 2000–2024; both sexes combined. There are no duplicate country/year/sex keys in the extract.
- **Fields:** ISO3 country code, year, litres of pure alcohol per adult aged 15+, lower/upper uncertainty bounds, WHO region and update date.
- **Purpose:** establish global variation and place Australia in context. Select a common year for the map rather than mixing countries' latest years.
- **Chart:** world choropleth, using `geoshape`, a geography lookup and a sequential colour scale. Use an equal-area world projection such as Equal Earth.
- **Access:** [indicator metadata](https://data.who.int/indicators/i/EF38E6A/EE6F72A); [exact JSON endpoint](https://ghoapi.azureedge.net/api/SA_0000001688).
- **Local:** `source-data/D01_WHO_total_consumption_raw.json` and `source-data/D01_WHO_total_consumption_countries.csv`.
- **Preparation/caution:** exclude regional aggregates; convert country codes to geometry keys; label values as WHO estimates and three-year averages. This endpoint contains no age-group or male/female breakdown. The public indicator page's coverage metadata is older than the API response; preserve this dated snapshot and cite the exact endpoint. The 2024 Australian value repeats 2023, so do not describe every annual value as a new observed survey measurement.

### D02 — WHO heavy episodic drinking by sex

- **Owner/product:** WHO GHO, indicator `SA_0000001739`, age-standardised heavy episodic drinking among the population aged 15+.
- **Verified coverage:** 11,809 country/year/sex rows spanning 2000–2020; latest year contains 187 locations for both-sex estimates. Male, female and combined estimates are available. No duplicate keys were found.
- **Fields:** country, WHO region, year, sex, prevalence percentage and uncertainty bounds.
- **Purpose:** show that average national consumption and occasional high-intensity drinking measure different behaviours; examine the gender gap internationally.
- **Chart:** a regional box plot of country-level prevalence, with male/female selection and an Australia overlay. Explain the median and middle-half box in plain language. Each country is one observation; this is not the distribution of individual drinkers and is not a population-weighted regional estimate.
- **Access:** [consumption-pattern indicators](https://www.who.int/data/gho/data/themes/topics/GHO/patterns-of-consumption); [definition](https://www.who.int/data/gho/data/indicators/indicator-details/GHO/alcohol-heavy-episodic-drinking-%2815-%29-past-30-days-%28-%29-age-standardized-with-95-ci); [JSON endpoint](https://ghoapi.azureedge.net/api/SA_0000001739).
- **Local:** `source-data/D02_WHO_heavy_episodic_drinking_raw.json` and `source-data/D02_WHO_heavy_episodic_drinking_countries.csv`.
- **Preparation/caution:** the definition is at least 60 grams of pure alcohol on an occasion in the past 30 days; the denominator includes abstainers. Do not relabel it as Australia's guideline measure, and do not confuse it with a separate WHO drinkers-only indicator. This extract is ages 15+; it is not an age-group dataset.

### D03 — National Drug Strategy Household Survey: alcohol

- **Owner/product:** Australian Institute of Health and Welfare (AIHW), NDSHS 2022–2023, national alcohol workbook and state/territory workbook.
- **Coverage:** people aged 14+, Australia; many national series span 2001–2022–23, state series commonly 2007–2022–23. Individual measures have different start years.
- **Fields:** age group, gender, survey year, drinking status, daily drinking, weekly and episodic risk, beverage preference, sources of alcohol, attitudes, harms and state.
- **Useful verified tables:** 4.2–4.4 status by gender/age; 4.5 daily drinking by age; 4.6 adolescent recent drinking; 4.7–4.8 beverage preferences by age/gender; 4.13 initiation age; 4.27–4.30 risk by age/gender over time; 4.31 joint weekly/episodic-risk categories; 9b.16 state risk percentages; 9b.17 estimated people at risk; 9b.22 risk by age and state.
- **Purpose:** the main backbone for the assignment topic: long-term age patterns, changing gender differences and population variation.
- **Charts:** age-by-year heatmap, a mosaic of weekly versus episodic risk, and a state tile-grid cartogram. Other tables can support annotations without adding repetitive charts.
- **Access:** [official download page](https://www.aihw.gov.au/reports/illicit-use-of-drugs/national-drug-strategy-household-survey-2022-2023/data); [alcohol XLSX](https://www.aihw.gov.au/getmedia/2bfbb5c1-a572-4075-b905-910904236781/aihw-phe-340-National-Drug-Strategy-Household-Survey-2022-2023-4-Alcohol-consumption.xlsx); [state XLSX](https://www.aihw.gov.au/getmedia/db6d1df6-ddb3-454c-9a51-d00eced3b017/National-Drug-Strategy-Household-Survey-2022-2023-9b-States-and-Territories.xlsx).
- **Local:** `source-data/D03_NDSHS_alcohol.xlsx` and `source-data/D03_NDSHS_states.xlsx`.
- **Preparation/caution:** remove presentation headers and reshape selected tables to CSV, preserving footnotes and reliability flags. Use a single published definition across a time series; changes to alcohol guidelines can otherwise create a false trend. The newer NDSHS 2025 release available in August 2026 covers tobacco/nicotine insights, not replacement alcohol tables; do not switch to it just because its survey year is newer. These are repeated cross-sectional surveys, not the same individuals followed through life.

### D04 — ABS National Health Survey: alcohol by age and sex

- **Owner/product:** Australian Bureau of Statistics (ABS), National Health Survey 2022, Table 7.
- **Coverage:** Australia, 2022. Workbook covers persons aged 15+ and separates adult guideline results; use 18+ for adult-guideline conclusions.
- **Fields:** age, sex, alcohol-consumption categories, estimated people, proportions, relative standard errors and margins of error.
- **Useful tables:** 7.1 estimates, 7.3 proportions, 7.2/7.4 reliability information.
- **Purpose:** independently collected demographic evidence to complement NDSHS rather than treating one survey as the only view of the population.
- **Chart:** age-group dumbbell comparing male and female proportions exceeding the adult guideline.
- **Access:** [NHS downloads](https://www.abs.gov.au/statistics/health/health-conditions-and-risks/national-health-survey/2022); [Table 7 XLSX](https://www.abs.gov.au/statistics/health/health-conditions-and-risks/national-health-survey/2022/NHSDC07.xlsx); [alcohol commentary and methodology](https://www.abs.gov.au/statistics/health/health-conditions-and-risks/alcohol-consumption/2022).
- **Local:** `source-data/D04_ABS_NHS_alcohol_age_sex.xlsx`.
- **Preparation/caution:** these NHS estimates should not be spliced into NDSHS as additional years. Survey modes, populations and questions differ. Keep source-specific sex/gender labels. NHS is not a source of an individual-level drinking distribution for violin plots.

### D05 — Australian Secondary Students' Alcohol and Drug survey

- **Owner/product:** ASSAD 2022–2023; national report published by the Australian Government Department of Health, research coordinated by Cancer Council Victoria and partners.
- **Coverage:** secondary-school students aged 12–17, latest wave 2022–23; historical comparisons are published in the report. The survey series began in 1984, but do not assume every alcohol measure in this report spans that entire period.
- **Fields:** age, sex/gender where published, ever/past-year/past-month/past-week drinking, beverage sources, drinking locations, intentions and negative experiences.
- **Verified table locations:** Table 2 (printed page 6 / PDF page 9) provides prevalence by gender and broad age group; Table A2 (printed page 53 / PDF page 56) provides age groups within gender. Table 3 uses a drinkers-only denominator and must not be confused with Table 2's all-student prevalence.
- **Purpose:** add the school-age population, which adult survey summaries can conceal, and show how drinking is obtained and experienced.
- **Chart:** annotated waffle chart for one clearly defined adolescent drinking prevalence; use an age selector and contextual historical annotations.
- **Access:** [official report and accessible formats](https://www.health.gov.au/resources/publications/australian-secondary-school-students-use-of-alcohol-and-other-substances-2022-2023?language=en); [report PDF](https://www.health.gov.au/sites/default/files/2024-02/australian-secondary-school-students-use-of-alcohol-and-other-substances-2022-2023.pdf).
- **Local:** `source-data/D05_ASSAD_2022_2023.pdf`.
- **Preparation/caution:** this product is public aggregate tables, not an open individual-record CSV. Extract only needed numerical tables and check them against the report; this is the highest preparation effort of the ten. Use weighted prevalence, not raw sample counts. Explain that the sample covers students, not all adolescents. The latest wave changed administration and had low school participation, so retain the report's comparability/reliability cautions. Ever drinking includes even part of a drink and must not be called current drinking. A waffle with 100 cells is a percentage illustration, not 100 sampled respondents; retain exact percentage labels when rounding cells.

### D06 — Alcohol available for consumption in Australia

- **Owner/product:** AIHW, updated November 2025, continuing the former ABS apparent-consumption series.
- **Coverage:** total pure-alcohol series 1960–61 to 2023–24; some beer/wine volume series extend to 1944–45; cider pure-alcohol series starts in 2004–05.
- **Fields:** financial year, beverage category, litres of beverage/pure alcohol and per-capita availability among people aged 15+.
- **Useful verified tables:** 1 beer pure alcohol; 3 wine pure alcohol; 5 spirits pure alcohol; 6 cider pure alcohol; 7 total pure alcohol and per-capita availability.
- **Purpose:** the strongest long-run volume series, plus the changing beverage mix. Prefer this updated series to the old ABS release ending in 2017–18.
- **Charts:** annotated long-run line and beverage-composition stacked area chart.
- **Access:** [official download page](https://www.aihw.gov.au/reports/alcohol/alcohol-available-for-consumption-in-australia/data); [XLSX](https://www.aihw.gov.au/getmedia/103e7c27-595e-418f-8260-685c3c2dc3c7/PHE331_AACA_Data-tables-2023-24.xlsx); [definitions and trends](https://www.aihw.gov.au/reports/alcohol/alcohol-available-for-consumption-in-australia/contents/trends-in-alcohol-available-for-consumption).
- **Local:** `source-data/D06_alcohol_availability_2023_2024.xlsx`.
- **Preparation/caution:** availability measures production/import supply, not observed individual consumption; it does not adjust for all wastage, cellaring or cooking. Use pure alcohol for cross-beverage comparisons. Preserve financial-year labels and missing cider history; missing is not zero. Align the beverage-share chart to years with a comparable, complete composition.

### D07 — ABS alcohol-induced deaths

- **Owner/product:** ABS Causes of Death, Australia 2024, data cube 13.
- **Coverage:** alcohol-specific tables mainly 2015–2024; some geographic/socioeconomic tables 2020–2024. Recent years are provisional or revised.
- **Fields:** year, sex, age, alcohol-induced death count, age-specific/age-standardised rate, acute/chronic classification and selected geographical/socioeconomic groupings.
- **Useful verified tables:** 13.11 counts/rates over time; 13.12 age/sex-specific deaths/rates; 13.16 acute/chronic deaths by age and sex. Table 13.17 uses year of occurrence and must not be mixed with registration-year series.
- **Purpose:** show why a falling drinking average does not automatically imply falling mortality, and how the consequences differ by age and sex.
- **Chart:** waterfall of annual changes in death count from the 2015 starting total to 2024, with a clear distinction between accounting changes and causal explanations. Put an age-standardised-rate annotation next to it so population growth is not mistaken for a change in individual risk.
- **Access:** [latest release and downloads](https://www.abs.gov.au/statistics/health/causes-death/causes-death-australia/latest-release); [alcohol-specific XLSX](https://www.abs.gov.au/statistics/health/causes-death/causes-death-australia/2024/2024_13%20Drug%20and%20alcohol-induced%20deaths%20%28Australia%29.xlsx).
- **Local:** `source-data/D07_ABS_alcohol_induced_deaths_2024.xlsx`; additionally `source-data/D07_ABS_revision_release_2026.xlsx` was inspected.
- **Preparation/caution:** the May 2026 revision workbook updates underlying causes and selected drug/suicide tables but does not publish replacement alcohol-specific tables. Keep the alcohol cube's explicit revision status; if reconstructing alcohol totals from revised ICD codes, document that as a new derivation. Alcohol-induced deaths are a narrow coded definition, not all deaths attributable partly to alcohol. They cannot be added to burden-of-disease estimates. The next advertised Causes of Death release is 27 October 2026, after the brief's stated deadline.

### D08 — Alcohol and other drug treatment services

- **Owner/product:** AIHW AOD treatment services annual report 2024–25, national client and state episode tables.
- **Coverage:** Australia, latest 2024–25; selected state episode series 2015–16 to 2024–25 and national demographic series 2013–14 onwards.
- **Fields:** principal drug of concern, treatment clients or closed episodes, age, sex, state/territory, main treatment and referral/cessation categories.
- **Useful verified tables:** SC.9 alcohol clients by sex; SC.10 alcohol clients by age; ST [state].6 alcohol-principal-drug episodes by year, for all eight jurisdictions.
- **Purpose:** connect consumption to observed service demand, with a clearly different denominator from survey prevalence.
- **Chart:** proportional-symbol map, symbol area proportional to alcohol-principal-drug closed episodes in each state, placed at representative state locations. State coordinates are symbol anchors, not actual treatment locations.
- **Access:** [official downloads](https://www.aihw.gov.au/reports/alcohol-other-drug-treatment-services/alcohol-other-drug-treatment-services-australia/data); [national clients XLSX](https://www.aihw.gov.au/getmedia/b25428bf-edbc-481c-8e3a-b8c3fa2fe843/aihw-hse-258-2425-SC-clients-national-tables-25062026_3.xlsx); [state episodes XLSX](https://www.aihw.gov.au/getmedia/969ef089-7732-4ca6-9051-1d923dbeab6e/aihw-hse-258-2425-ST-state-territory-episode-tables-25062026_1.xlsx).
- **Local:** `source-data/D08_treatment_clients_2024_2025.xlsx`, `source-data/D08_treatment_states_2024_2025.xlsx`.
- **Preparation/caution:** filter principal drug of concern to alcohol and own-drug-use treatment. Closed episodes are not unique patients; repeated episodes and access to services affect the counts. Larger states can have larger counts because of population size. Do not merge separate age and sex marginal tables into an invented age-by-sex cross-tabulation. The hospitalisation dataset supplies the genuine joint age/sex table for the grouped horizontal bar chart.

### D09 — Alcohol-attributable burden of disease

- **Owner/product:** AIHW Australian Burden of Disease Study 2024, compact alcohol-related extract ABDS1.
- **Coverage:** Australia, estimated 2024 burden, by linked disease and sex. The full study additionally contains historical reference years; the compact downloaded extract does not.
- **Fields:** disease group/subcategory, sex, healthy life years lost attributable to alcohol, total disease burden and attributable percentage.
- **Purpose:** show that alcohol consequences span disorders, injuries, cancers, cardiovascular disease and chronic liver disease.
- **Chart:** ranked horizontal bars of mutually exclusive major disease-group contributions, with sex selection, direct count labels and exact shares in tooltips.
- **Access:** [full study/data](https://www.aihw.gov.au/reports/burden-of-disease/australian-burden-of-disease-study-2024/data); [compact data collection page](https://www.aihw.gov.au/reports/alcohol/alcohol-tobacco-other-drugs-australia/data); [compact XLSX](https://www.aihw.gov.au/getmedia/f6366c20-5686-454e-a3a9-3bbba5db789a/AIHW-PHE221_ABDS-tables_DEC25_1.xlsx).
- **Local:** `source-data/D09_alcohol_attributable_burden_2024.xlsx`.
- **Preparation/caution:** the table contains major groups followed by their components. Use only Alcohol use disorder, Injuries, Cancers, Cardiovascular diseases and Chronic liver disease for top-level groups; exclude Total and the detailed injury/cancer rows from the same sum. Implementation checks on 14 October found these five groups sum to 228,402 healthy life years versus the published total of 238,262. This is larger than rounding. A complete contribution chart therefore needs an explicitly derived residual labelled "Not itemised in this extract" (9,860 years), calculated as total minus the five groups, without inferring its disease composition. Explain DALY as healthy life years lost, not people or deaths. The revised ranked bars use these values directly in Vega-Lite; the legacy `burden-treemap.json` filename and unused coordinates remain for reproducible source extraction.

### D10 — Alcohol-related hospitalisations

- **Owner/product:** AIHW National Hospital Morbidity Database (NHMD), alcohol-related aggregate tables.
- **Coverage:** latest alcohol tables 2023–24; time series 2015–16 to 2023–24. This alcohol extract can lag the broader hospital collection.
- **Fields:** year, age, sex, principal diagnosis group, same-day/overnight status, admission/separation count, remoteness and crude population rate where published.
- **Useful verified tables:** NHMD1 same-day; NHMD2 overnight; NHMD3 total by age/sex; NHMD4 time series; NHMD5 remoteness series.
- **Purpose:** show the age/sex pattern of hospital consequences and distinguish it from the age pattern of reported drinking.
- **Chart:** grouped horizontal age/sex bars from the alcohol columns in NHMD3. Label counts as hospitalisations, not people; optionally show published rates in a separate view if denominator data exists.
- **Access:** [official table collection](https://www.aihw.gov.au/reports/alcohol/alcohol-tobacco-other-drugs-australia/data); [NHMD XLSX](https://www.aihw.gov.au/getmedia/f774a123-a571-4938-a7b7-f7957d0dc6ce/AIHW-PHE221_NHMD-tables_DEC25_1.xlsx).
- **Local:** `source-data/D10_alcohol_hospitalisations_2023_2024.xlsx`.
- **Preparation/caution:** this extract explicitly provides **no state/territory disaggregation**, so it must not be used for a state choropleth. Repeated hospitalisations are not unique patients. Totals can include ages under 15 and age/sex not stated, beyond the displayed age/sex categories. The workbook applies revised diagnosis groupings retrospectively; use its revised time series consistently.

## Thirteen-chart narrative, entirely rendered in Vega-Lite

The story should have useful default views before anyone touches a control. Interactions refine a visible argument; they should not hide the main sections or force the reader to discover the story.

| # | Section and reader question | Product | Idiom | Vega-Lite implementation |
|---:|---|---|---|---|
| 1 | Context: how much do countries drink? | D01 | World choropleth map | `geoshape`, geographic `lookup`, Equal Earth projection, year selection |
| 2 | Context: how does episodic drinking vary by sex internationally? | D02 | Box plot of country estimates | Native `boxplot`, sex/region controls, labelled Australia marker; explain what the box means |
| 3 | Changing habits: how has the national average changed? | D06 | Annotated line | `line` with `rule`/`text` layers and a clearly stated availability measure |
| 4 | Changing habits: has the beverage mix changed? | D06 | 100% stacked area | `area`, normalised shares from pure-alcohol volumes; choose complete-composition years |
| 5 | Changing habits: which ages changed most? | D03 | Age-by-year heatmap | `rect`, ordered age groups, quantitative colour, measure selector; repeated cross-sections |
| 6 | Changing habits: what is adolescent drinking like now? | D05 | Waffle / unit chart | `rect` plus generated percentage-cell coordinates and exact text; define period and population |
| 7 | Population differences: where is the adult male/female gap? | D04 | Dumbbell | Layered `rule`, `point` and labels; retain source reliability flags |
| 8 | Population differences: do weekly and episodic risks overlap? | D03 | Mosaic / Marimekko | Joint categories from 4.31; `rect` using computed `x/x2/y/y2` boundaries, plus labels |
| 9 | Geography: which states have higher risky-drinking prevalence? | D03 | Tile-grid cartogram map | Equal-size state tiles with fixed approximate geographic arrangement, value colour and labels |
| 10 | Geography: where is recorded treatment demand largest? | D08 | Proportional-symbol map | Australia `geoshape` base; `circle` size by state alcohol episodes, longitude/latitude anchors |
| 11 | Consequences: who has alcohol-related hospitalisations? | D10 | Grouped horizontal bars | `bar`, positive counts, shared zero baseline, fixed gender colours, ordered ages |
| 12 | Consequences: which conditions contribute to alcohol burden? | D09 | Ranked horizontal bars | Vega-Lite `bar`/`text`, positive count scale, explicit residual and sex selection |
| 13 | Consequences: how did recorded mortality change over the decade? | D07 | Waterfall | `window`/`calculate` or precomputed deltas; ranged bars, totals, connecting rules and labels |

The revised design keeps three map idioms and 13 charts. Intended advanced forms are the choropleth, boxplot, heatmap, waffle, dumbbell, mosaic, tile cartogram, proportional-symbol map and waterfall. Classification remains subject to marker judgement; the design record explains each chart against its analytical question. The hospital and burden bars replace the earlier pyramid and treemap to improve direct count comparisons. A series of similar charts still counts as one chart under the rubric.

The design plan supports all ten products without making ten unrelated stories. Keep consumption and behaviour central in the first three sections, and use consequences for the final section rather than turning the project into a general health dashboard.

## Vega-Lite feasibility and data preparation

No paid service, Vega-Lite account, special credential or supplied specification is needed. Vega-Lite is loaded by the webpage, typically with Vega and vega-embed as its runtime. **All chart/map marks should be rendered by Vega-Lite.** HTML/CSS can arrange the page and text; local Python/JavaScript may convert source tables and compute layout coordinates without drawing charts.

The selected products need these operations:

1. Keep the originals and this retrieval date as provenance.
2. Convert selected XLSX worksheets and ASSAD aggregate tables to tidy CSV/JSON. Vega-Lite does not directly read XLSX or PDF tables.
3. Use separate schemas where populations/units differ. Useful fields include `dataset_id`, `year`, `period_label`, `country_iso3`, `state_code`, `age_group`, `sex_or_gender`, `measure`, `value`, `unit`, `denominator`, `reliability_flag` and `source_url`. Do not force unavailable dimensions into the data.
4. Treat `n.p.`, suppressed and unavailable values as null, preserving their meaning. Never turn them into zeros, infer missing joint categories or sum overlapping risk measures.
5. Join geography using stable country/state keys. Obtain simplified world and Australia boundary assets from public, documented sources, recording their attribution separately. Geometry is not included in this research bundle yet.
6. Precompute tile positions and mosaic coordinates where needed. Coordinates describe layout, not new observations. Keep calculation code and use source totals to validate area proportions.
7. Host only small selected chart tables and simplified geometry in the runtime path. Keep large WHO raw snapshots and original workbooks as research inputs, not downloads requested by the page. Aim for roughly 1–2 MB of runtime data, then measure the actual total. That target is a design budget, not a measured website size.
8. Publish readable `.vl.json` files alongside the page; include chart sources, author, date and AI-use acknowledgement.

Documentation checked: [geoshape](https://vega.github.io/vega-lite/docs/geoshape.html), [projection](https://vega.github.io/vega-lite/docs/projection.html), [lookup](https://vega.github.io/vega-lite/docs/lookup.html), [rect and ranged rectangles](https://vega.github.io/vega-lite/docs/rect.html), [box plot](https://vega.github.io/vega-lite/docs/boxplot.html). The custom-layout charts are feasible with these primitives, but no chart specifications or webpage have been built or render-tested in this research phase.

## Findings to use carefully in the eventual narrative

- AIHW's updated availability series reports 10.9 litres of pure alcohol per person aged 15+ in 2020–21 and 9.8 in 2023–24. Call this supply/availability, not a direct observation of how much each individual drank. [Source](https://www.aihw.gov.au/reports/alcohol/alcohol-available-for-consumption-in-australia/contents/trends-in-alcohol-available-for-consumption)
- NDSHS commentary describes a long-term fall in under-18 drinking followed by recent stability and a changing gender gap among young adults. These are useful hypotheses to annotate using the matching national tables and their definitions. [Source](https://www.aihw.gov.au/reports/illicit-use-of-drugs/national-drug-strategy-household-survey-2022-2023/contents/summary)
- ABS NHS gives a clear independent snapshot: 35.8% of adult males and 18.1% of adult females exceeded the adult guideline in 2022. The contrast is within the NHS; it is not a numerical trend against NDSHS. [Source](https://www.abs.gov.au/statistics/health/health-conditions-and-risks/national-health-survey/2022)
- The compact 2024 burden table reports 238,262 healthy life years lost attributable to alcohol, 4.1% of all estimated disease burden. Its groups reveal a broader effect than alcohol use disorder alone. [Source](https://www.aihw.gov.au/reports/burden-of-disease/australian-burden-of-disease-study-2024/contents/key-findings)

Do not claim that the same individuals drink less as they age, that alcohol causes a correlation found by joining population summaries, or that treatment access proves consumption prevalence. All outcome sources use different populations, periods and definitions.

## What is complete and what still needs the user

Complete: full brief review; rubric interpretation; ten selected products with official provenance and exact access links; local originals for all ten; tidy country-only CSV extracts for both WHO indicators; workbook table and dimension checks; preliminary 13-chart story plan; Vega-Lite feasibility assessment.

Implementation update, 14 October 2026: the tidy chart tables, checked ASSAD transcription, geography assets, 13 Vega-Lite specifications and scrollable webpage are complete. All 13 charts render successfully against the local data and the exposed selectors pass automated checks. See the project README for preview and publishing instructions. The student's hand-drawn sketch and tutor interview remain separate requirements.

**No user intervention is required for Vega-Lite.** The user supplied the GitHub repository `fichera9188/dataviz` for publication. The project includes a GitHub Pages workflow; deployment status is verified separately. This implementation does not create a digital replacement for the assessed hand sketch.
