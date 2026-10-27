# Chart design justifications

Author: Teh Ming Dong. Updated 27 October 2026.

These design explanations are project documentation. They are deliberately kept out of the published visualisation. Source citations, units, definitions and data limitations remain with the charts so readers can interpret the evidence.

## Colour meanings

Teal (`#397B76`) exclusively represents males; plum (`#80516B`) exclusively represents females. Charcoal represents single series. The ochre ramp represents magnitude; brick and olive distinguish mortality increases and decreases. Category palettes keep explicit, stable labels. Selecting a population changes the data, not the colour meaning.

## 01. World consumption

**Question:** Where do estimated consumption levels differ geographically?

**How to read it:** Country colours reveal geographic patterns; land area does not represent population or alcohol volume.

**Why this chart:** A choropleth places consumption estimates in their geographic context, making broad spatial patterns visible.

**Alternative considered:** Ranked bars would compare country values more precisely but would hide their geographic arrangement.

**Limitations:** Large countries attract more visual attention. Grey means no matched estimate, not zero consumption.

## 02. Regional drinking distributions

**Question:** How variable are country estimates within each region, and where does Australia sit?

**How to read it:** Boxes show regional variation that an average would conceal; the outlined diamond identifies Australia.

**Why this chart:** Boxplots summarise the median, middle half and full range of many country estimates without a crowded list.

**Alternative considered:** Regional average bars would conceal how different the countries within a region can be.

**Limitations:** Each country has equal weight. Whiskers show the minimum and maximum, not the usual 1.5-IQR rule; country counts and quartiles are in the tooltip.

## 03. Six decades of availability

**Question:** How did Australian alcohol availability change over time?

**How to read it:** The connected line makes long-term peaks, turning points and recent changes easier to follow than separate annual bars.

**Why this chart:** Position on one time axis supports reading a continuous trajectory across six decades.

**Alternative considered:** Annual bars would emphasise individual years and make the overall path harder to follow.

**Limitations:** Availability measures supply per person aged 15+, not an individual's reported intake.

## 04. Beverage composition

**Question:** How has the composition of available pure alcohol changed?

**How to read it:** Stacked bands keep the whole at 100% while showing how the beverage mix changes over time.

**Why this chart:** A 100% stacked area chart communicates composition and change together. The main latest-year shares are directly labelled.

**Alternative considered:** Separate lines would make individual trajectories easier to compare but weaken the immediate part-to-whole reading.

**Limitations:** Middle bands do not have a common baseline. Hover for exact shares, including cider's small share; these are pure-alcohol shares, not beverage-volume shares.

## 05. Age and survey waves

**Question:** Which age groups report higher percentages, and how does the pattern differ across survey waves?

**How to read it:** The age-by-year grid exposes patterns without overlapping many lines; darker cells always mean higher percentages.

**Why this chart:** A heatmap fits many age-by-wave combinations into a readable matrix with chronological columns and ordered age groups.

**Alternative considered:** Multiple lines would help trace one group precisely but become crowded when all groups are shown.

**Limitations:** The 0–60% scale stays fixed across measures. Blank cells are missing or unsuitable estimates, and each wave samples different people.

## 06. Adolescent drinking

**Question:** What does the selected reported percentage look like out of 100 percentage points?

**How to read it:** The grid explains one selected share out of 100 percentage points; the large number preserves the exact estimate.

**Why this chart:** A waffle supports a focused, accessible part-to-whole explanation of one selected group and drinking period.

**Alternative considered:** A bar would be more compact and better for simultaneous comparison of many categories.

**Limitations:** Squares are percentage points, not individual students. A fractional square preserves the published decimal estimate.

## 07. Adult gender gap

**Question:** How large is the male–female difference within each adult age group?

**How to read it:** Connectors expose each age group's gap: teal circles show males and plum squares show females.

**Why this chart:** Two connected positions on the same percentage axis make within-age differences visible with little visual clutter.

**Alternative considered:** Grouped bars would work, but the distance between estimates is less explicit.

**Limitations:** These are source-specific survey estimates. Differences describe association, not a causal explanation.

## 08. Overlapping thresholds

**Question:** How do weekly volume and monthly high-volume occasions overlap?

**How to read it:** Columns separate weekly volume; within drinker columns, lower cells represent monthly high-volume occasions. Areas show population shares.

**Why this chart:** A mosaic represents the joint structure of two thresholds as well as the five category shares. Abstainers are separate.

**Alternative considered:** A pie or a single stacked bar would show category shares without making the two-threshold organisation as explicit.

**Limitations:** Cell heights are conditional within columns. Weekly-only and episodic-only are different patterns, not an ordered severity scale. Areas are normalised only for published rounding.

## 09. State prevalence

**Question:** How does risky-drinking prevalence differ among states and territories?

**How to read it:** Equal-sized tiles give small territories the same visibility as large states; colour shows percentage, not population size.

**Why this chart:** A tile cartogram retains approximate geography while preventing large land areas from dominating the comparison.

**Alternative considered:** A conventional Australian choropleth would give large states much more visual weight.

**Limitations:** Tile positions are approximate. The fixed 0–60% scale encodes the selected survey population's percentage; counts and land area are not encoded.

## 10. Recorded treatment demand

**Question:** Where are recorded alcohol treatment episodes concentrated geographically?

**How to read it:** Circle area compares episode counts at geographic locations; a fixed size scale keeps different years comparable.

**Why this chart:** A proportional-symbol map combines location with the size of recorded caseload, contrasting with prevalence in the neighbouring chart.

**Alternative considered:** Sorted bars would rank counts more precisely; exact labels and the size legend support comparison here.

**Limitations:** Episodes are not unique clients or population-adjusted rates, and do not establish unmet demand. Australian Capital Territory's displaced circle is connected to its location.

## 11. Hospitalisations by age and sex — tornado chart

**Question:** How do recorded hospitalisation counts differ by age group and sex?

**How to read it:** Male counts extend left and female counts right from a shared zero. Both sides use the same count scale and positive labels.

**Why this chart:** A tornado chart keeps each age group on one row and separates male and female counts spatially. Equal scales preserve bar-length comparisons, while exact positive labels and the legend identify the two populations.

**Alternative considered:** Grouped bars also offer a shared zero baseline, but require two rows within each age band. The mirrored layout was selected to emphasise the two populations’ age profiles.

**Limitations:** The negative plotting coordinate only places male bars on the left; hospitalisation counts are never negative. These are episodes, not unique people or age-specific risk. The open-ended 55+ band includes more ages. This is not a population pyramid or a sensitivity analysis.

## 12. Disease burden contributions

**Question:** Which listed disease groups contribute most to alcohol-attributable healthy life years lost?

**How to read it:** Ranked bar lengths make contributions easier to compare; the lighter bar is the explicitly labelled derived residual.

**Why this chart:** Six groups fit on a shared zero baseline with readable names, counts and tooltip shares. Wider views also label the shares directly.

**Alternative considered:** A treemap provides a composition overview, but comparing areas and fitting labels is less effective for this ranking question.

**Limitations:** The residual is the total minus the five listed groups, not an invented disease category. The same count scale is used for every selected sex; colour identifies listed values versus the residual.

## 13. Mortality changes over time

**Question:** How did yearly increases and decreases add up to the difference between 2015 and 2024?

**How to read it:** Floating bars explain how signed yearly changes add up; the final column is the 2024 total, not another change.

**Why this chart:** A waterfall makes the arithmetic contribution of each year's change explicit while retaining the starting and ending totals.

**Alternative considered:** A line would show the trajectory, but would not separate the contributions to the final difference as directly.

**Limitations:** Increases and decreases explain the arithmetic, not its causes. Recent counts can be revised; alcohol-induced deaths are narrower than all alcohol-attributable deaths.
