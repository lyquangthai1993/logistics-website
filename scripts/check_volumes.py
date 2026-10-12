import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "")
PROJECT_ID = "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"

def gql(query, variables=None):
    data = {"query": query}
    if variables:
        data["variables"] = variables
    req = urllib.request.Request(
        RAILWAY_API_URL,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "Railway-CLI/5.23.3"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTPError:", e.read().decode("utf-8"))
        return {}

q_logs = """
query {
  deploymentLogs(deploymentId: "308aa540-0e6d-4ae0-8781-fe37f80dedc6", limit: 25) {
    timestamp
    message
    severity
  }
}
"""
res_logs = gql(q_logs)
logs = res_logs.get("data", {}).get("deploymentLogs", [])
for l in logs[-15:]:
    print(f"[{l.get('severity')}] {l.get('message')}")






