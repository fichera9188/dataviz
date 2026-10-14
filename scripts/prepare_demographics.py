"""Extract published survey/treatment tables without modifying the original workbooks.

Run with the bundled Python runtime. JSON values use percentage points (0..100)
except treatment episodes, which are integer counts. Coordinates are layout only.
"""
from pathlib import Path
import hashlib
import json
from collections import Counter

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/alcohol/source-data"
OUTPUT = ROOT / "site/data"
STATES = {
    "NSW": "New South Wales", "VIC": "Victoria", "QLD": "Queensland",
    "WA": "Western Australia", "SA": "South Australia", "TAS": "Tasmania",
    "ACT": "Australian Capital Territory", "NT": "Northern Territory",
}
AUDIT = {"prepared_date": "2026-10-14", "assets": {}, "inputs": {}, "checks": {}}


def book(name):
    path = SOURCE / name
    AUDIT["inputs"][name] = {"sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    return openpyxl.load_workbook(path, read_only=True, data_only=True)


def rows(sheet, last):
    # Cache a bounded portion once: repeated read-only cell access re-parses XML.
    return list(sheet.iter_rows(max_row=last))


def cell(table, row, col):
    return table[row - 1][col - 1]


def normal(text):
    return str(text).replace("\u00a0", " ").replace("\n", " ").strip()


def number(raw, number_format=""):
    flags = []
    if raw is None or normal(raw).lower() in ("n.p.", "np", "n.a.", ".", ""):
        return None, "Not published / not applicable"
    text = normal(raw)
    if "**" in text:
        flags.append("** RSE 51–90%; unsuitable for most uses")
    elif "*" in text or '"*"' in number_format:
        flags.append("* RSE 25–50%; use with caution")
    if "#" in text or '"#"' in number_format:
        flags.append("# Statistically significant change since 2019")
    clean = text.replace("*", "").replace("#", "")
    if "<" in clean:
        flags.append("Published as less than 0.1%; no exact point estimate")
        return None, "; ".join(flags)
    return float(clean), "; ".join(flags) or "None"


def dump(name, data, metadata):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    AUDIT["assets"][name] = dict(metadata, rows=len(data), bytes=(OUTPUT / f"{name}.json").stat().st_size)


def prepare_age(alcohol):
    data = []
    mappings = [
        ("Table 4.5", 5, "Daily drinking"),
        ("Table 4.27", 28, "Risky drinking"),
        ("Table 4.27", 50, "More than 10 drinks weekly"),
        ("Table 4.27", 72, "More than 4 drinks monthly"),
    ]
    cache = {name: rows(alcohol[name], 101 if name == "Table 4.27" else 32) for name, _, _ in mappings}
    for sheet, first, measure in mappings:
        table = cache[sheet]
        for row in range(first, first + 8):
            age = normal(cell(table, row, 1).value)
            for col in range(2, 10):
                point = cell(table, row, col)
                value, flag = number(point.value, point.number_format)
                usable = not flag.startswith("**") and value is not None
                period = normal(cell(table, 4, col).value)
                data.append({"year": int(period[:4]), "period": period, "age": age,
                             "measure": measure, "value": value if usable else None,
                             "published_value": normal(point.value), "flag": flag,
                             "source_cell": f"{sheet}!{point.coordinate}"})
    assert len(data) == 256
    assert len({(d["measure"], d["age"], d["year"]) for d in data}) == len(data)
    def get(measure, age, year):
        return next(d["value"] for d in data if d["measure"] == measure and d["age"] == age and d["year"] == year)
    AUDIT["checks"]["age_trends"] = {
        "18–24_monthly_2001_2022": [get("More than 4 drinks monthly", "18–24", y) for y in (2001, 2022)],
        "60–69_monthly_2001_2022": [get("More than 4 drinks monthly", "60–69", y) for y in (2001, 2022)],
        "70+_daily_2001_2022": [get("Daily drinking", "70+", y) for y in (2001, 2022)],
        "null_points": sum(d["value"] is None for d in data),
    }
    dump("age-trends", data, {
        "dataset_id": "D03", "source": "D03_NDSHS_alcohol.xlsx",
        "tables": ["Table 4.5!A4:I12", "Table 4.27!A28:I35", "Table 4.27!A50:I57", "Table 4.27!A72:I79"],
        "unit": "Percent of people in the age group, all genders",
        "measures": [m[2] for m in mappings],
        "definitions": {
            "Daily drinking": "Consumed alcohol daily.",
            "Risky drinking": "More than 10 standard drinks weekly OR more than 4 on a single day at least monthly, average over previous 12 months; fixed 2020 guideline definition applied to all displayed waves.",
            "More than 10 drinks weekly": "More than 10 standard drinks per week on average in previous 12 months.",
            "More than 4 drinks monthly": "More than 4 standard drinks on one occasion at least once a month over previous 12 months.",
        },
        "handling": "Original flags preserved. n.p., censored <0.1 and ** estimates unsuitable for most uses have null chart value; original published string retained. Main age bins only, excluding overlapping additional bins and totals.",
        "limitations": "Repeated cross-sections, not people tracked over time. A wave labelled 2022–2023 has numeric ordering key 2022. # is significance versus 2019 only, not versus2001.",
    })


def prepare_adult(nhs):
    props = rows(nhs["Table 7.3_Proportions"], 90)
    rse = rows(nhs["Table 7.2_RSEs"], 90)
    moe = rows(nhs["Table 7.4_MoEs"], 90)
    data = []
    # Mutually exclusive adult groups; split65+ into65–74 and75+.
    for sex, row in [("Males", 37), ("Females", 61)]:
        for col in [3, 4, 5, 6, 7, 13, 14, 17]:
            c = cell(props, row, col)
            value, flag = number(c.value, c.number_format)
            # '#' in ABS proportion format refers to a high margin of error,
            # unlike '#' in NDSHS. The selected cells have no source flags.
            if flag.startswith("#"):
                flag = "# High margin of error; use with caution"
            age = normal(cell(props, 6, col).value).replace("75 years and over", "75+").replace("Total 18 years and over", "All adults 18+")
            data.append({"age": age, "sex": sex, "value": value, "flag": flag,
                         "rse": float(cell(rse, row, col).value), "moe": float(cell(moe, row, col).value),
                         "source_cell": f"Table 7.3_Proportions!{c.coordinate}"})
    total = {d["sex"]: d["value"] for d in data if d["age"] == "All adults 18+"}
    assert total == {"Males": 35.8, "Females": 18.1}
    AUDIT["checks"]["adult_guideline_totals"] = dict(total, gap_percentage_points=round(total["Males"] - total["Females"], 1))
    dump("adult-gap", data, {
        "dataset_id": "D04", "source": "D04_ABS_NHS_alcohol_age_sex.xlsx",
        "tables": ["Table 7.3_Proportions!C37:G37,M37:N37,Q37", "Table 7.3_Proportions!C61:G61,M61:N61,Q61", "Table 7.2_RSEs same cells", "Table 7.4_MoEs same cells"],
        "year": 2022, "unit": "Percent of adults in the corresponding age/sex group",
        "definition": "Total exceeded2020 adult guideline: >10 drinks in last week or5+ on any day in last12 months at least monthly. At least monthly interpreted as12+ times in last12 months.",
        "sex_definition": "Sex recorded at birth; table uses Males/Females. ABS persons totals can include other terms.",
        "notes": "Do not splice this NHS snapshot into NDSHS series. Published cells are randomly adjusted for confidentiality; component sums can differ. moe is a percentage-point margin; rse is percent. Adult total is a summary and must not be summed with age groups.",
    })


def prepare_mosaic(alcohol):
    table = rows(alcohol["Table 4.31"], 60)
    data = []
    checks = {}
    for gender, first in [("Males", 6), ("Females", 10), ("Persons", 14)]:
        groups = [
            ("Abstainer", [(first, 2, "Abstainer", "No alcohol")]),
            ("10 drinks weekly or less", [(first + 1, 3, "Not monthly", "Neither threshold"), (first + 1, 4, "Monthly >4 drinks", "Episodic only")]),
            ("More than 10 drinks weekly", [(first + 2, 3, "Not monthly", "Weekly only"), (first + 2, 4, "Monthly >4 drinks", "Both thresholds")]),
        ]
        total = sum(float(cell(table, r, c).value) for _, entries in groups for r, c, _, _ in entries)
        assert abs(total - 100) < .11
        x0 = 0
        for weekly, entries in groups:
            group = sum(float(cell(table, r, c).value) for r, c, _, _ in entries)
            x1 = x0 + group / total * 100
            y0 = 0
            for r, c, episodic, label in entries:
                point = cell(table, r, c)
                value = float(point.value)
                y1 = y0 + value / group * 100
                record = {"gender": gender, "weekly": weekly, "episodic": episodic,
                          "value": value, "x0": round(x0, 8), "x1": round(x1, 8),
                          "y0": round(y0, 8), "y1": round(y1, 8), "label": label,
                          "flag": "None", "rse": cell(table, r + 25, c).value,
                          "source_cell": f"Table 4.31!{point.coordinate}"}
                area = (record["x1"] - record["x0"]) * (record["y1"] - record["y0"]) / 10000
                assert abs(area - value / total) < 1e-8
                data.append(record)
                y0 = y1
            assert abs(y0 - 100) < 1e-8
            x0 = x1
        assert abs(x0 - 100) < 1e-8
        checks[gender] = {"published_sum_percent": round(total, 1), "total_rectangle_area": round(sum((d["x1"]-d["x0"])*(d["y1"]-d["y0"])/10000 for d in data if d["gender"] == gender), 8)}
    # Independently match published marginal totals in Table4.27, Persons14+.
    marginal = rows(alcohol["Table 4.27"], 101)
    persons = [d for d in data if d["gender"] == "Persons"]
    risky = sum(d["value"] for d in persons if d["label"] in ("Weekly only", "Episodic only", "Both thresholds"))
    assert abs(risky - float(cell(marginal, 36, 9).value)) < 1e-8
    assert abs(sum(d["value"] for d in persons if d["weekly"] == "More than 10 drinks weekly") - float(cell(marginal, 58, 9).value)) < 1e-8
    assert abs(sum(d["value"] for d in persons if d["episodic"] == "Monthly >4 drinks") - float(cell(marginal, 80, 9).value)) < .11
    AUDIT["checks"]["mosaic"] = dict(checks, persons_risky_percent=round(risky, 1))
    dump("risk-mosaic", data, {
        "dataset_id": "D03", "source": "D03_NDSHS_alcohol.xlsx", "tables": ["Table 4.31!B6:D16; reliabilityB31:D41", "Marginal cross-check Table 4.27!I36,I58,I80"],
        "period": "2022–2023", "population": "People aged14+", "unit": "Table percent within each gender",
        "definitions": "Weekly threshold is >10 standard drinks per week on average. Episodic threshold is >4 drinks on an occasion at least monthly over past12 months. Abstainer is no alcohol in past12 months.",
        "source_correction": "Footnotes(d)/(e) in Table4.31 reverse the weekly definitions. Followed explicit row labels, independently checked against Table4.27 marginal totals.",
        "geometry": "Within each gender, x-width is weekly marginal / sum published cells; y-height is cell / weekly marginal. All geometries use0–100 coordinates. Female sum99.9 due to rounding; only geometry normalized, published values unchanged. n.a. structural combinations are omitted, never converted to invented data.",
    })


def prepare_states(states):
    table = rows(states["Table 9b.16"], 62)
    data = []
    for index, (state, state_name) in enumerate(STATES.items()):
        col = 7 + index * 6
        for gender, row in [("Males", 9), ("Females", 13), ("Persons", 17)]:
            c = cell(table, row, col)
            value, flag = number(c.value)
            data.append({"state": state, "state_name": state_name, "gender": gender,
                         "value": value, "flag": flag, "year": 2022, "period": "2022–2023",
                         "rse": cell(table, row + 26, col).value,
                         "moe": cell(table, row + 45, col).value,
                         "source_cell": f"Table 9b.16!{c.coordinate}"})
    assert len(data) == 24
    persons = {d["state"]: d["value"] for d in data if d["gender"] == "Persons"}
    assert persons["NT"] == 40.4 and persons["VIC"] == 26.4
    AUDIT["checks"]["state_risk_persons"] = persons
    dump("state-risk", data, {
        "dataset_id": "D03", "source": "D03_NDSHS_states.xlsx", "tables": ["Table 9b.16 rows9,13,17; columnsG,M,S,Y,AE,AK,AQ,AW", "RSE rows35,39,43; MOE rows54,58,62"],
        "unit": "Percent of people aged14+ within state and gender",
        "definition": "Derived from2020 NHMRC guideline1: more than10 standard drinks weekly OR more than4 on a single day at least monthly, on average.",
        "notes": "Latest2022–2023 wave only. Crude survey prevalence, not age-standardised. Sampled prevalence and ranking have sampling uncertainty. # refers to significant change since2019, not differences between states.",
    })


def prepare_treatment(treatment):
    data = []
    totals = Counter()
    for state, state_name in STATES.items():
        sheet = f"Table ST {state}.6"
        table = rows(treatment[sheet], 28)
        assert cell(table, 11, 3).value == "Alcohol"
        for col in range(4, 14):
            c = cell(table, 11, col)
            period = normal(cell(table, 3, col).value)
            episodes = c.value
            assert isinstance(episodes, int) and episodes >= 0
            data.append({"state": state, "state_name": state_name, "year": int(period[:4]),
                         "period": period, "episodes": episodes, "source_cell": f"{sheet}!{c.coordinate}"})
            totals[period] += episodes
    assert len(data) == 80
    assert len({(d["state"], d["year"]) for d in data}) == len(data)
    AUDIT["checks"]["treatment_state_sums"] = dict(sorted(totals.items()))
    dump("treatment-states", data, {
        "dataset_id": "D08", "source": "D08_treatment_states_2024_2025.xlsx",
        "tables": [f"Table ST {s}.6!D11:M11; periodsD3:M3" for s in STATES],
        "unit": "Closed treatment episodes",
        "definition": "Closed treatment episodes for own drug use where principal drug of concern is Alcohol.",
        "notes": "Counts are episodes, not unique patients. State totals reflect population size, service coverage, access and reporting. Fiscal year uses starting numeric year. No per-capita denominator is provided or inferred.",
    })


def main():
    alcohol = book("D03_NDSHS_alcohol.xlsx")
    prepare_age(alcohol)
    prepare_mosaic(alcohol)
    prepare_states(book("D03_NDSHS_states.xlsx"))
    prepare_adult(book("D04_ABS_NHS_alcohol_age_sex.xlsx"))
    prepare_treatment(book("D08_treatment_states_2024_2025.xlsx"))
    for name in ("age-trends", "adult-gap", "risk-mosaic", "state-risk"):
        data = json.loads((OUTPUT / f"{name}.json").read_text(encoding="utf-8"))
        assert all(d["value"] is None or 0 <= d["value"] <= 100 for d in data)
    (ROOT / "scripts/demographic-audit.json").write_text(json.dumps(AUDIT, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(AUDIT["checks"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
