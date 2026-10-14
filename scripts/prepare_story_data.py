"""Extract published aggregate data; retain originals under research/alcohol.

All figures are source values. Derived coordinates describe chart layouts only.
"""
import json
import math
import re
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'research/alcohol/source-data'
OUT = ROOT / 'site/data'
OUT.mkdir(parents=True, exist_ok=True)
audit = {}

def write(name, rows):
    path = OUT / f'{name}.json'
    path.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':'), allow_nan=False), encoding='utf-8')
    audit[name] = {'rows': len(rows), 'bytes': path.stat().st_size}

def book(name):
    return load_workbook(RAW / name, read_only=True, data_only=True)

def numeric(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)

def financial(row):
    return isinstance(row[0], str) and re.fullmatch(r'\d{4}[–-]\d{2,4}', row[0])

def period_data(sheet, volume_col, per_capita_col):
    return [{'year': int(r[0][:4]), 'period': r[0], 'volume': r[volume_col], 'value': r[per_capita_col]}
            for r in sheet.values if financial(r) and numeric(r[volume_col]) and numeric(r[per_capita_col])]

# WHO: minimise the runtime data, keeping the complete total-consumption history.
who = json.loads((RAW / 'D01_WHO_total_consumption_raw.json').read_text(encoding='utf-8'))['value']
world = [{'iso3': r['SpatialDim'], 'year': r['TimeDim'], 'value': round(r['NumericValue'], 3),
          'lower': round(r['Low'], 2) if numeric(r['Low']) else None,
          'upper': round(r['High'], 2) if numeric(r['High']) else None}
         for r in who if r['SpatialDimType'] == 'COUNTRY' and numeric(r['NumericValue'])]
assert len({(r['iso3'], r['year']) for r in world}) == len(world)
write('world-consumption', world)
sex_names = {'SEX_BTSX': 'All', 'SEX_MLE': 'Male', 'SEX_FMLE': 'Female'}
who = json.loads((RAW / 'D02_WHO_heavy_episodic_drinking_raw.json').read_text(encoding='utf-8'))['value']
hed = [{'iso3': r['SpatialDim'], 'region': r['ParentLocation'], 'sex': sex_names[r['Dim1']],
        'year': 2020, 'value': round(r['NumericValue'], 3)}
       for r in who if r['SpatialDimType'] == 'COUNTRY' and r['TimeDim'] == 2020 and numeric(r['NumericValue'])]
assert len({(r['iso3'], r['sex']) for r in hed}) == len(hed)
write('episodic-country', hed)

# D06. Availability is not self-reported individual consumption.
w = book('D06_alcohol_availability_2023_2024.xlsx')
availability = period_data(w['Table 7'], 1, 3)
assert len(availability) == 64 and availability[-1]['period'] == '2023–24'
write('availability', availability)
beverages = []
for label, sheet, volume_col, pc_col, order in [('Beer', 'Table 1', 4, 9, 0), ('Wine', 'Table 3', 4, 9, 1),
                                               ('Spirits & RTDs', 'Table 5', 3, 7, 2), ('Cider', 'Table 6', 1, 3, 3)]:
    for row in period_data(w[sheet], volume_col, pc_col):
        # Cider was not estimated before 2004–05. Do not invent zeros for it.
        if row['year'] >= 2011:
            beverages.append({**row, 'beverage': label, 'order': order})
for year in range(2011, 2024):
    rows = [r for r in beverages if r['year'] == year]
    assert len(rows) == 4
    expected = next(r['volume'] for r in availability if r['year'] == year)
    # The published thousands-of-litres series is independently rounded.
    assert abs(sum(r['volume'] for r in rows) - expected) <= 2
    total = sum(r['volume'] for r in rows)
    for r in rows:
        r['share'] = round(r['volume'] / total, 8)
write('beverage-mix', beverages)
audit['beverage-mix']['note'] = 'Composition shown from2011–12: earlier published beverage totals have discrepancies beyond rounding against Table7. Retained source values; no adjustments made. 2011–12 onwards reconciles within independently rounded thousands of litres.'
w.close()

# D05. Checked transcription of ASSAD Table 2, printed p6 / PDF p9.
# Each tuple: total, males, females, ages12–15, ages16–17 (weighted percentages).
assad_values = {
    'Ever': [64.8, 62.3, 66.7, 59.0, 77.9],
    'Past year': [43.7, 40.5, 46.8, 35.0, 63.8],
    'Past month': [22.2, 19.9, 24.9, 16.0, 36.6],
    'Past week': [10.8, 10.0, 11.6, 7.3, 18.9],
    'Risky past week': [3.8, 3.6, 4.1, 1.6, 8.8],
}
groups = ['All students', 'Male students', 'Female students', 'Ages 12–15', 'Ages 16–17']
assad = [{'group': g, 'measure': measure, 'value': value, 'period': '2022–23', 'table': 'Table 2'}
         for measure, values in assad_values.items() for g, value in zip(groups, values)]
write('adolescent', assad)
waffle = []
for row in assad:
    for i in range(100):
        fraction = max(0, min(1, row['value'] - i))
        waffle.append({'group': row['group'], 'measure': row['measure'], 'value': row['value'],
                       'col': i % 10, 'row': i // 10, 'x0': i % 10,
                       'x1': i % 10 + fraction * .86, 'y0': i // 10, 'y1': i // 10 + .86,
                       'filled': fraction > 0})
write('adolescent-waffle', waffle)
audit['adolescent']['provenance'] = 'Manual transcription verified against ASSAD Table 2 (PDF page 9) rendered in previous research turn; published weighted percentages, not sample counts.'

# D07. Deaths by registration year: provisional status retained.
w = book('D07_ABS_alcohol_induced_deaths_2024.xlsx')
deaths = []
for r in w['Table 13.11'].values:
    if numeric(r[0]) and 2015 <= r[0] <= 2024:
        status = 'Final' if r[0] <= 2021 else ('Revised' if r[0] == 2022 else 'Preliminary revised' if r[0] == 2023 else 'Preliminary')
        for i, sex in enumerate(['Male', 'Female', 'All']):
            deaths.append({'year': int(r[0]), 'sex': sex, 'count': r[i+1], 'rate': r[i+4], 'status': status})
assert len(deaths) == 30
write('deaths', deaths)
waterfall = []
for sex in ['All', 'Male', 'Female']:
    series = sorted([r for r in deaths if r['sex'] == sex], key=lambda r: r['year'])
    first, last = series[0], series[-1]
    waterfall.append({**first, 'step': '2015 total', 'order': 0, 'start': 0, 'end': first['count'], 'change': first['count'], 'kind': 'Total', 'label': f"{first['count']:,}"})
    for i, (previous, current) in enumerate(zip(series, series[1:]), 1):
        delta = current['count'] - previous['count']
        waterfall.append({**current, 'step': str(current['year']), 'order': i, 'start': previous['count'], 'end': current['count'], 'change': delta,
                          'kind': 'Increase' if delta >= 0 else 'Decrease', 'label': f'{delta:+,}'})
    waterfall.append({**last, 'step': '2024 total', 'order': 10, 'start': 0, 'end': last['count'], 'change': last['count'], 'kind': 'Total', 'label': f"{last['count']:,}"})
    assert first['count'] + sum(r['change'] for r in waterfall if r['sex'] == sex and r['kind'] != 'Total') == last['count']
write('death-waterfall', waterfall)
w.close()

# D10. The actual joint age/sex table; totals include categories not shown.
w = book('D10_alcohol_hospitalisations_2023_2024.xlsx')
hospital = []
hospital_totals = {}
for r in w['NHMD3'].values:
    if r[0] in ['Male', 'Female', 'Persons'] and numeric(r[2]):
        if r[1] == 'Total':
            hospital_totals[r[0]] = r[2]
        elif r[0] in ['Male', 'Female']:
            hospital.append({'age': r[1], 'sex': r[0], 'count': r[2], 'signed': -r[2] if r[0] == 'Male' else r[2], 'share_within_sex': r[3], 'period': '2023–24'})
assert len(hospital) == 10 and hospital_totals['Persons'] == 84318
write('hospital-age-sex', hospital)
audit['hospital-age-sex']['published_totals'] = hospital_totals
audit['hospital-age-sex']['note'] = 'Totals include under15/unknown age and other/unknown sex. Displayed bars do not exhaust total. These are episodes, not unique people.'
w.close()

# D09. Five mutually exclusive top-level groups only; exclude all subcategory rows.
w = book('D09_alcohol_attributable_burden_2024.xlsx')
groups = ['Alcohol use disorder', 'Injuries', 'Cancers', 'Cardiovascular diseases', 'Chronic liver disease']
burden = []
totals = {}
for r in w['ABDS1'].values:
    if r[0] == 'Total':
        totals = {sex: r[col] for sex, col in [('Male', 1), ('Female', 4), ('All', 7)]}
    elif r[0] in groups:
        for sex, col in [('Male', 1), ('Female', 4), ('All', 7)]:
            burden.append({'disease': r[0], 'sex': sex, 'value': r[col], 'attributable_percent': r[col+2], 'year': 2024})
assert len(burden) == 15
residuals = {}
for sex in ['Male', 'Female', 'All']:
    subtotal = sum(r['value'] for r in burden if r['sex'] == sex)
    remainder = totals[sex] - subtotal
    assert remainder > 0
    residuals[sex] = remainder
    burden.append({'disease': 'Not itemised in this extract', 'sex': sex, 'value': remainder,
                   'attributable_percent': None, 'year': 2024, 'derived': True})
for sex in ['Male', 'Female', 'All']:
    rows = sorted([r for r in burden if r['sex'] == sex], key=lambda r: -r['value'])
    total = sum(r['value'] for r in rows)
    assert abs(total - totals[sex]) <= 2
    # Binary area-balanced treemap, using proportional split coordinates.
    def partition(items, x0, y0, x1, y1):
        if len(items) == 1:
            r = items[0]
            r.update(x0=round(x0, 6), y0=round(y0, 6), x1=round(x1, 6), y1=round(y1, 6),
                     cx=round((x0+x1)/2, 6), cy=round((y0+y1)/2, 6), share=round(r['value']/total, 6))
            return
        target = sum(r['value'] for r in items)/2
        cut = min(range(1, len(items)), key=lambda i: abs(sum(r['value'] for r in items[:i])-target))
        a, b = items[:cut], items[cut:]
        fraction = sum(r['value'] for r in a) / sum(r['value'] for r in items)
        # The rendered chart is twice as wide as tall; use that physical ratio.
        if (x1-x0)*2 >= y1-y0:
            mid = x0 + (x1-x0)*fraction
            partition(a,x0,y0,mid,y1); partition(b,mid,y0,x1,y1)
        else:
            mid = y0 + (y1-y0)*fraction
            partition(a,x0,y0,x1,mid); partition(b,x0,mid,x1,y1)
    partition(rows, 0, 0, 1, 1)
    assert abs(sum((r['x1']-r['x0'])*(r['y1']-r['y0']) for r in rows)-1) < .00001
write('burden-treemap', burden)
audit['burden-treemap']['published_totals'] = totals
audit['burden-treemap']['derived_residuals'] = residuals
audit['burden-treemap']['note'] = 'Five listed major groups do not exhaust the published alcohol-attributable total. Not itemised in this extract is explicitly derived as total minus five mutually exclusive top-level groups; not a newly observed disease category. Child rows are excluded.'
w.close()

peak = max(availability, key=lambda r: r['value'])
latest = availability[-1]
summary = {
    'availability_latest': latest, 'availability_peak': peak,
    'availability_peak_decline_percent': round((peak['value']-latest['value'])/peak['value']*100, 1),
    'availability_recent_decline_percent': round((next(r['value'] for r in availability if r['year']==2020)-latest['value'])/next(r['value'] for r in availability if r['year']==2020)*100,1),
    'burden_total': totals['All'], 'burden_share_percent': 4.1,
    'hospitalisations': hospital_totals['Persons'],
    'hospitalisations_45plus_percent': round((sum(r['count'] for r in hospital if r['age'] in ['45–54','55+']))/hospital_totals['Persons']*100,1),
    'deaths_latest': next(r for r in deaths if r['year']==2024 and r['sex']=='All'),
    'deaths_2015': next(r for r in deaths if r['year']==2015 and r['sex']=='All'),
    'data_snapshot_date': '2026-10-13', 'page_date': '2026-10-14',
}
(OUT / 'story-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2),encoding='utf-8')
(ROOT / 'scripts/story-data-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
