import csv
from pathlib import Path

REGISTRY_PATH = Path(__file__).resolve().parent.parent / "data" / "registry.csv"

def query_person_registry(keyword, field="all"):
    """
    Queries the personnel registry.csv for matching records.
    keyword: search query string
    field: 'name', 'city', 'country', 'job_title', or 'all'
    """
    if not REGISTRY_PATH.exists():
        return {"status": "error", "message": f"Registry file not found at {REGISTRY_PATH}"}

    results = []
    keyword_lower = str(keyword).strip().lower()

    with open(REGISTRY_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            match = False
            if field in row:
                if keyword_lower in row[field].lower():
                    match = True
            else:
                for k, v in row.items():
                    if keyword_lower in str(v).lower():
                        match = True
                        break
            if match:
                results.append(row)

    return {
        "status": "success",
        "query": keyword,
        "field": field,
        "total_matches": len(results),
        "results": results
    }

if __name__ == "__main__":
    print(query_person_registry("Lucas Dubois", "name"))
