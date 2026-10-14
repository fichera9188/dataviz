# A changing drinking culture

A scrollable alcohol-consumption data story by **Teh Ming Dong**. Every chart and map is rendered with Vega-Lite. The page moves from global context to Australia's long-term changes, age and gender differences, geography, and health consequences.

## Preview locally

With Node.js installed, run `npm run dev` from this folder, then open <http://127.0.0.1:4173/>. No package installation is needed. On this Windows computer, you can also double-click `start-preview.cmd`.

Serve the page over HTTP; opening `site/index.html` directly as a file prevents browsers from fetching the separate chart specifications and data.

## Project files

- `site/`: complete static website, local fonts, pinned Vega runtimes, compact data and readable Vega-Lite JSON specifications.
- `scripts/`: data preparation, specification generation, preview server and rendering verification.
- `research/alcohol/DATASET_GUIDE.md`: source research, definitions and limitations.
- `research/alcohol/DATASET_CATALOG.json`: catalogue of the ten source data products.
- `.github/workflows/pages.yml`: publish the `site/` folder using GitHub Pages.

Original source workbooks and the assignment brief stay local. The website includes compact derived data and links to the publishers. Source extraction expects the original workbooks in `research/alcohol/source-data/` and Python with `openpyxl`; the ASSAD percentages are checked manual transcriptions. See each preparation script and audit for provenance.

## Validation

Run `npm run check` to compile and render all 13 specifications with the actual local data, test exposed selector options, validate source links and geographic keys, and check the runtime data budget. The report and SVG previews are written to the ignored `verification/` folder. Run `npm run build:specs` after editing `scripts/build_specs.mjs`.

## Chart and rubric coverage

The story contains 13 charts using ten source data products from WHO, AIHW, ABS and ASSAD. Its three map idioms are a world choropleth, an Australian tile cartogram and an Australian proportional-symbol map. Additional advanced idioms are a box plot, heatmap, waffle, dumbbell, mosaic, treemap and waterfall. The hospital age/sex pyramid, time-series line chart and stacked beverage area chart complete the story. Classification of idioms remains subject to the marker's judgement; this is a coverage plan, not a grade guarantee.

Each chart has a purpose, tooltip information, a readable specification and a source citation. Controls change year, sex, student population or drinking measure where the underlying data supports it. Small screens use a single-column layout.

## Data interpretation

- The ten datasets are ten **data products**, not ten independent publishers. NDSHS alcohol and state workbooks are one product.
- WHO consumption estimates use adults aged 15+, while heavy episodic drinking uses an age-standardised population measure. Australian survey thresholds have different definitions and denominators.
- Availability describes supply; it is not self-reported intake. Beverage shares start in 2011–12 because earlier source subtotals do not reconcile.
- Treatment counts are closed episodes, not unique people. Hospital counts use actual jointly tabulated age and sex, and the 55+ band is open-ended.
- The burden extract does not itemise its full total. Its derived residual is explicitly labelled “Not itemised in this extract”; no disease allocation is invented.
- Recent death counts may be revised. Suppressed or censored survey observations remain missing rather than becoming zero.
- WHO values for four French territories lack separate map geometry. The map does not invent polygons for them.

Source-specific coverage and notes appear in the page's expandable source section. Data were retrieved on 13–14 October 2026. AI assistance is acknowledged in the footer.

## GitHub Pages

Repository: <https://github.com/fichera9188/dataviz>. Enable **Settings → Pages → Source → GitHub Actions**. A push to `main` starts the prepared publishing workflow. The expected project address is <https://fichera9188.github.io/dataviz/>; a successful deployment must be confirmed before treating that address as live.

The assignment's hand-drawn sketch and tutor interview still require the student's own completion. The website does not substitute for those requirements.
