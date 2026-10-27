**Colour consistency and chart-choice plan — alcohol consumption story**

Prepared for Teh Ming Dong, 27 October 2026. Status: implementation completed on 27 October 2026; verification and deployment are recorded in the project history.

The objective is to make colour meanings predictable and give every chart a defensible purpose. Preserve the five-chapter story, the existing alignment, the six-size typography system, the ten source data products and the use of Vega-Lite for all charts.

**1. Problems confirmed in the current specifications**

The shared palette in `scripts/build_specs.mjs` assigns teal `#397B76` to males and plum `#80516B` to females. Those colours are also reused for regional boxplots, the availability trend, beverage categories, drinking-pattern categories, treatment circles, disease groups and waterfall decreases. Some quantitative ramps also approach the female plum. This makes a reader relearn colour meanings between charts.

The chart audit also identifies two weak matches between question and encoding: the hospital pyramid uses mirrored, signed plotting positions for positive counts, and the treemap asks readers to compare six areas when the main question is which disease groups contribute most. The waterfall is useful for explaining accumulated changes, but its current headline emphasises a trend comparison that a line chart could answer more directly. Its question and endpoint labels should therefore be revised.

**2. Establish a colour contract**

| Role | Proposed colour | Rule |
|---|---|---|
| Male / males | Teal `#397B76` | Exclusively encodes the published male category. |
| Female / females | Plum `#80516B` | Exclusively encodes the published female category. |
| A single series, all people, or a total | Charcoal `#46505A` | Default for a quantity without a categorical colour comparison. |
| Quantitative intensity | `#FFF1CC` → `#E5BE62` → `#B78324` → `#6E450E` | Light to dark means lower to higher values. |
| Increase in the mortality waterfall | Brick `#B54432` | Arithmetic increase in the recorded count. |
| Decrease in the mortality waterfall | Olive `#6F7A32` | Arithmetic decrease in the recorded count. |
| Labels and outlines | Ink `#29252E` | Does not encode a data category. |
| Missing geographic estimates | Pale grey `#E4DED2` | Explicitly identified as missing; never treated as zero. |

The hex values are the proposed starting palette. Contrast and colour-vision checks are acceptance gates before finalising them.

Binding rules:

- Remove teal, plum and confusingly similar variants from all non-gender data marks, ramps, annotations, callout numbers and chart legends.
- Use the same gender mapping for singular and plural source labels, without changing the source data's category definitions.
- Selecting a sex in a dropdown does not automatically change a chart's colour meaning. A prevalence map still colours percentage; a waterfall still colours increase/decrease. Their selection is stated in the control, subtitle and tooltip.
- Reinforce gender with labels and, where useful, different point shapes. Readers should not need colour alone to identify a series.
- Most single-series charts use charcoal. Additional categorical colours are justified only when categories must be distinguished simultaneously.
- Gender colours are globally exclusive. Other palettes follow their stated role and local legend; assigning a globally unique hue to every category in all 13 charts would create an unnecessarily large, difficult palette.
- Keep category order, colour assignment and legends stable after filtering. Do not let automatic colour assignment change a category's meaning when some categories disappear.
- Use sequential intensity for magnitude, qualitative palettes for unordered categories, and a distinct direction palette for signed changes. Do not imply that unordered beverage types are a low-to-high scale.

For the remaining categorical charts, use two explicitly named palettes with direct labels:

| Chart | Proposed mappings |
|---|---|
| Beverage composition | Beer `#C99B35`; wine `#87583D`; spirits & RTDs `#5E6C7A`; cider `#B7A98B`. |
| Drinking-pattern mosaic | No alcohol: outlined paper; neither threshold: light grey; episodic only: ochre; weekly only: slate blue; both thresholds: brick. Exact category shades will be checked together against the gender palette. |

Use an outline and a labelled diamond to identify Australia in the global comparison, rather than borrowing a gender colour. The adolescent waffle uses charcoal for the selected percentage and pale cells for the remainder.

**3. Keep colour scales honest**

Use a fixed 0–60% colour domain for the age heatmap and state prevalence tiles across all available selections. Current maximum values are 58.5% and 45.2%, respectively. An automated check must reject future values outside that range rather than silently clipping them.

The world map keeps its separate litres scale, with the upper legend category explicitly labelled 15+. Its legend must state litres of pure alcohol per person aged 15+. Sharing a light-to-dark colour family with a percentage chart means increasing magnitude; it does not make their units or definitions interchangeable.

Treatment circle area remains proportional to episode count, with a common size domain across years. The hospital and mortality charts retain stable count axes across relevant selections. Every chart names its unit and population.

**4. Review all 13 chart choices**

For each chart, document the question, data structure, reason for the encoding, closest alternative and practical limitation. The following decisions are recommendations for this story, not claims that one chart type is universally best.

1. **World consumption: retain the choropleth.** Question: where do estimated consumption levels differ geographically? Country polygons and sequential colour expose broad spatial patterns. A ranked bar chart would support more exact ranking but obscure the global geographic structure. Use the ochre-to-brown scale, preserve missing-data distinctions and outline Australia. State that geographic area does not represent population or alcohol volume.

2. **Heavy episodic drinking: retain the regional boxplots.** Question: how variable are country estimates within each WHO region, and where does Australia sit? Boxplots summarise median, middle half and full spread without drawing a long list of countries. A regional mean bar would conceal within-region variation. Add clear median/spread explanations and country counts; distinguish min–max whiskers from the usual 1.5-IQR convention. Use neutral boxes and an outlined Australia marker. Each country is one observation, not one surveyed individual.

3. **Six decades of availability: retain the line chart.** Question: how did availability change over time? Position on a common time axis makes peaks, turning points and sustained changes legible. Dozens of annual bars would emphasise separate years and weaken the continuous trend. Use a charcoal line and subtle neutral shading, with direct labels for the historical peak and latest observation. Keep the existing reveal animation. Explain that availability measures supply rather than reported intake.

4. **Beverage mix: retain the 100% stacked area chart.** Question: how did the composition of available pure alcohol change? The full height represents the whole, while band thickness shows each beverage's share over time. Separate lines would make individual trajectories easier to compare but would weaken the immediate part-to-whole reading. Keep a fixed 0–100% axis, consistent stacking order, direct endpoint labels and exact tooltip shares. Acknowledge that middle bands are harder to compare precisely. Use the beverage palette, never the gender palette.

5. **Age and survey waves: retain the heatmap.** Question: which age groups have higher reported percentages, and how does that pattern differ across survey waves? A matrix fits many age-by-wave combinations without overlapping lines. A multi-line chart would help track one age group precisely but become crowded with all age groups and measures. Keep chronological columns, ordered ages, fixed 0–60% colour scaling and exact tooltip values. Blank/suppressed estimates stay distinguishable from zero. Explain that survey waves are different samples, not the same individuals followed through time.

6. **Adolescent drinking: retain the waffle for a single selected proportion.** Question: what does this reported percentage look like out of 100 percentage points? The grid gives general readers an accessible part-to-whole explanation for one group and period. A simple bar is more compact and better for comparing many categories; the waffle is retained because this section focuses on one selected percentage, supported by a large exact number. Preserve fractional cells and explain that the squares are percentage points, not 100 individual students. Use charcoal rather than gender or risk colours for the filled portion.

7. **Adult gender gap: retain the dumbbell.** Question: how large is the male–female difference within each adult age group? Connected points use a shared percentage axis and make the within-age gap visible. Grouped bars would work but add ink and make the distance between estimates less explicit. Keep male teal and female plum, add redundant identification and show percentage-point gaps where space allows. Do not treat differing age-specific gaps as a causal explanation.

8. **Weekly and episodic overlap: retain and clarify the mosaic.** Question: how do the two drinking thresholds overlap? Two binary dimensions create joint categories, so a mosaic can express the structure of their overlap as well as the shares. A pie or a single stacked bar would show five shares but would not explain their two-threshold organisation as directly. Keep abstainers visibly separate; label weekly-threshold columns and episodic subdivisions, normalise rectangle areas only for published rounding, and show exact shares. Use a categorical pattern palette. Weekly-only and episodic-only are not an ordered severity ranking. The caption must explain how to read the arrangement.

9. **State prevalence: retain the tile cartogram.** Question: how does risky-drinking prevalence differ among states and territories? Equal tiles give small territories the same visibility as large states and retain approximate geographic arrangement. A conventional Australian choropleth would give large land areas much more visual weight. Use the same fixed percentage ramp as the age heatmap, direct state/value labels and the published source terminology. Explain that tile position is approximate and tile area is not population.

10. **Treatment demand: retain the proportional-symbol map.** Question: where are recorded treatment episodes concentrated geographically? Locations provide spatial context and circle area represents a count. A sorted bar chart would support more precise ranking; the map is retained because this chapter explicitly contrasts geographic prevalence and geographic service caseload. Use charcoal circles, a fixed area scale across years, count labels and a clear size legend. Keep the labelled ACT displacement and leader line. Explain that episodes are not unique clients or population-adjusted rates and do not establish unmet demand.

11. **Hospitalisations: replace the mirrored pyramid with grouped horizontal bars.** Question: how do recorded hospitalisation counts differ by age group and sex? Side-by-side bars share a zero baseline and make within-age comparisons straightforward. The current mirrored display introduces signed plotting values for positive counts and resembles a population pyramid even though the age bands are uneven and 55+ is open-ended. Use male teal and female plum, chronological age order, exact counts and a zero-based count axis. Preserve the warning about the open-ended age band and avoid interpreting counts as age-specific risk.

12. **Health burden: replace the treemap with ranked horizontal bars.** Question: which listed disease groups contribute the most alcohol-attributable healthy life years lost? With only six displayed groups, common-baseline lengths support easier comparison and leave room for full labels. The treemap is valid for a broad composition overview, but area comparisons and small labels are weaker for this ranking task; the categories also have no meaningful nested hierarchy in the displayed extract. Use charcoal bars with counts and shares, plus a distinct labelled treatment for the derived residual. A sex selector filters the population; it does not turn disease categories into gender colours. Preserve the exact meaning of the residual: not itemised in this extract, not an invented disease group.

13. **Mortality changes: retain the waterfall and sharpen its question.** Question: how did yearly increases and decreases add up to the difference between 2015 and 2024? Floating bars show the arithmetic contribution of each change, which a line chart would not show as explicitly. For the default all-people view, the endpoint difference is 403 deaths. Update this statement with the sex selection. Use charcoal totals, brick increases, olive decreases and explicit plus/minus labels. Label the final column '2024 total' and distinguish it from '2024 change'; do not remove 'total' from that endpoint. Retain the sequential entrance animation. State that the waterfall describes arithmetic changes, not their causes, and that recent counts may be revised.

**5. Explain the choices on the page and in the submission material**

Add one short chart-reading sentence beside or immediately below each chart. For example: 'Each connector shows the difference between male and female estimates within an age group.' This serves the reader while also making the design intentional.

Keep the fuller question–encoding–alternative–limitation rationale in a design document and the page's expandable 'About this story' section, rather than adding a long academic paragraph to every card. Where the question changes, update the heading, explanatory text, tooltip terminology, accessible chart description and source notes together.

Use the existing six font sizes and roughly 60-character reading measure. Preserve the current chapter alignment, side explanations, control placement and responsive column layout. The grouped bars and ranked bars are targeted chart changes, not a page redesign.

**6. Preserve assignment coverage**

Keep 13 charts and all ten source data products. The brief's highest idiom band calls for at least eight advanced idioms across more than ten charts, and fewer than three map idioms limits that criterion's marks.

The revised design retains three map forms: world choropleth, state tile cartogram and treatment proportional-symbol map. Its intended advanced forms are those three maps plus boxplot, heatmap, waffle, dumbbell, mosaic and waterfall: nine in total, subject to the marker's classification. Retaining effective advanced forms provides coverage while replacing the weakest match, the treemap. Do not claim guaranteed marks or preserve an unsuitable chart merely to increase variety.

**7. Implementation order**

1. Record a baseline of all chart data, controls, labels and current rendered output. Finalise a semantic colour registry with separate gender, magnitude, change, beverage and pattern roles.
2. Refactor the shared colours in `scripts/build_specs.mjs` and remove unrelated uses of the gender colours from CSS callouts and annotations. Set explicit category domains and ranges so filtering cannot reorder colours. Retain source field names and published values.
3. Replace the hospital and burden specifications with grouped and ranked bars, respectively. Reuse the existing local datasets and containers. Revise the mosaic's reading aids and the waterfall's question and endpoint labels.
4. Update chart-reading captions, descriptions, tooltips and relevant explanatory text in `site/index.html` and `site/app.js`. Selected population, period and unit must remain clear.
5. Regenerate the standalone `.vl.json` files. Update the documented chart/rubric inventory and retain the named trend/waterfall mark groups used by `site/motion.js`.
6. Run data, render, colour and interaction checks. Review every changed view on desktop and mobile. Publish to GitHub Pages only after implementation is requested and these checks pass.

**8. Acceptance checks**

- Every male encoding uses the reserved male colour and every female encoding uses the reserved female colour.
- Reserved colours and confusingly similar variants do not appear as beverage, disease, risk-pattern, magnitude, generic-series or change encodings. An automated literal-colour check is paired with visual review of ramps, opacity and interpolation.
- A selected population never changes what the legend's colour encodes. Filters cannot swap category colours or rescale axes misleadingly.
- Missing values remain missing, zeros remain valid zeros, derived values retain their documentation, and no data products are lost.
- All 13 specifications compile and render without warnings, invalid geometry, clipped text or empty plots. Every supported selector is tested.
- The hospital bars use actual positive counts; the burden values and residual match the existing data; waterfall differences reconcile exactly to the final total.
- Legends, direct labels and chart-reading text communicate meaning without reliance on colour alone. Test common colour-vision deficiencies and greyscale. Aim for 4.5:1 contrast for normal text; inspect chart marks and backgrounds separately.
- Layout remains consistent at desktop, laptop and phone widths. Keep readable labels, short paragraphs, adequate plot space and no page-level horizontal overflow. On phones, the mortality chart intentionally scrolls within a labelled, keyboard-accessible region to keep all 11 steps readable at 12px.
- Animation checks still pass: play once, reveal in chronological order, finish cleanly on filters/resizing, and show the complete chart for reduced motion and printing.
- Recheck the 13-chart, ten-data-product and three-map inventory and document intended advanced-idiom coverage.
- The final design document gives every chart a question, a reason for its encoding, an alternative considered and a limitation. A justification is about the analytical task, not merely the chart's visual appearance.

**References and audit basis**

- Current project sources: `scripts/build_specs.mjs`, `site/specs/*.vl.json`, `site/styles.css`, `site/app.js`, `site/motion.js`, the prepared data and the supplied FIT3179 brief, especially its rubric on pages 5–6.
- [Vega-Lite scale documentation](https://vega.github.io/vega-lite/docs/scale.html): explicit domains and ranges underpin stable colour assignments.
- [ColorBrewer guidance](https://colorbrewer2.org/learnmore/schemes.html): sequential palettes represent ordered magnitude; qualitative palettes distinguish unordered categories.
- [Heer and Bostock, Crowdsourcing Graphical Perception](https://idl.uw.edu/papers/crowdsourcing-graphical-perception): research context for evaluating visual encodings and area-based comparisons. The chart recommendations above are design judgements for this story, not an assertion that one encoding is always best.
- A Graphify structural audit of the 11 scripts was saved under the ignored `verification/` folder. Its graph has unresolved references (48 dangling-endpoint edges and two self-loops), so it is an incomplete relationship aid. Colour assignments, data ranges and chart behaviour were checked directly in the source rather than inferred from that graph. No semantic-extraction API was used.
