"""Fetch public research sources. Does not publish anything or alter source values."""
import csv
import json
import shutil
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / 'source-data'
RAW.mkdir(parents=True, exist_ok=True)

downloads = {
    'D04_ABS_NHS_alcohol_age_sex.xlsx': 'https://www.abs.gov.au/statistics/health/health-conditions-and-risks/national-health-survey/2022/NHSDC07.xlsx',
    'D05_ASSAD_2022_2023.pdf': 'https://www.health.gov.au/sites/default/files/2024-02/australian-secondary-school-students-use-of-alcohol-and-other-substances-2022-2023.pdf',
    'D07_ABS_alcohol_induced_deaths_2024.xlsx': 'https://www.abs.gov.au/statistics/health/causes-death/causes-death-australia/2024/2024_13%20Drug%20and%20alcohol-induced%20deaths%20%28Australia%29.xlsx',
}
local_downloads = {
    'D03_NDSHS_alcohol.xlsx': 'aihw-phe-340-data-tables-National-Drug-Strategy-Household-Survey-2022-2023-4-Alcohol-consumption.xlsx',
    'D06_alcohol_availability_2023_2024.xlsx': 'PHE331_AACA_Data-tables-2023-24.xlsx',
    'D09_alcohol_attributable_burden_2024.xlsx': 'AIHW-PHE221_ABDS-tables_DEC25_2.xlsx',
    'D10_alcohol_hospitalisations_2023_2024.xlsx': 'AIHW-PHE221_NHMD-tables_DEC25_1.xlsx',
}

def fetch(item):
    name, url = item
    try:
        with urllib.request.urlopen(url, timeout=55) as response:
            data = response.read()
        expected = b'%PDF' if name.endswith('.pdf') else b'PK'
        if not data.startswith(expected):
            raise ValueError('Response does not match the expected file format')
        (RAW / name).write_bytes(data)
        return {'file': name, 'url': url, 'status': 'downloaded', 'bytes': len(data)}
    except Exception as exc:
        return {'file': name, 'url': url, 'status': 'failed', 'reason': str(exc)}

def who(item):
    prefix, code = item
    url = f'https://ghoapi.azureedge.net/api/{code}'
    with urllib.request.urlopen(url, timeout=55) as response:
        payload = json.load(response)
    rows = payload['value']
    if payload.get('@odata.nextLink'):
        raise ValueError('API response is paginated; do not silently truncate')
    (RAW / f'{prefix}_raw.json').write_text(json.dumps(payload), encoding='utf-8')
    countries = [r for r in rows if r['SpatialDimType'] == 'COUNTRY']
    columns = ['iso3', 'year', 'sex', 'value', 'lower', 'upper', 'region', 'indicator', 'period', 'source_updated']
    with (RAW / f'{prefix}_countries.csv').open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for r in countries:
            writer.writerow(dict(zip(columns, [r['SpatialDim'], r['TimeDim'], r.get('Dim1'), r['NumericValue'], r.get('Low'), r.get('High'), r.get('ParentLocation'), code, r.get('TimeDimensionValue'), r.get('Date')])))
    keys = [(r['SpatialDim'], r['TimeDim'], r.get('Dim1')) for r in countries]
    return {'dataset': prefix, 'url': url, 'status': 'downloaded', 'rows': len(countries), 'years': [min(r['TimeDim'] for r in countries), max(r['TimeDim'] for r in countries)], 'duplicate_keys': len(keys) - len(set(keys))}

if __name__ == '__main__':
    results = []
    for target, source in local_downloads.items():
        path = Path('C:/Users/cyftl/Downloads') / source
        if path.exists():
            shutil.copy2(path, RAW / target)
            results.append({'file': target, 'status': 'copied browser download', 'bytes': path.stat().st_size})
    with ThreadPoolExecutor(max_workers=5) as pool:
        jobs = [pool.submit(fetch, item) for item in downloads.items()]
        jobs += [pool.submit(who, item) for item in [('D01_WHO_total_consumption', 'SA_0000001688'), ('D02_WHO_heavy_episodic_drinking', 'SA_0000001739')]]
        for job in jobs:
            try:
                results.append(job.result())
            except Exception as exc:
                results.append({'status': 'failed', 'reason': str(exc)})
    (ROOT / 'download-audit.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    print(json.dumps(results, indent=2))
