import os, json

def extract_api_info(filepath):
    with open(filepath) as f:
        spec = json.load(f)
    
    info = spec.get("info", {})
    servers = [s.get("url") for s in spec.get("servers", [])]
    endpoints = []
    
    for path, methods in spec.get("paths", {}).items():
        for method, details in methods.items():
            endpoints.append({
                "path": path,
                "method": method.upper(),
                "summary": details.get("summary", ""),
                "parameters": [p.get("name") for p in details.get("parameters", []) if "name" in p],
                "responses": list(details.get("responses", {}).keys())
            })
    
    return {
        "title": info.get("title"),
        "version": info.get("version"),
        "description": info.get("description"),
        "base_urls": servers,
        "endpoints": endpoints
    }

merged = []
for file in os.listdir("data"):
    if file.endswith(".json"):
        try:
            merged.append(extract_api_info(os.path.join("data", file)))
        except Exception as e:
            print(f"❌ Error parsing {file}: {e}")

with open("data/api_docs_clean.json", "w") as f:
    json.dump(merged, f, indent=2)

print(f"✅ Extracted {len(merged)} APIs saved to data/api_docs_clean.json")
