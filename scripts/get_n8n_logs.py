import os
import json
import urllib.request
import sys

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"

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
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

query = """
query GetLogs($deploymentId: String!) {
  deploymentLogs(deploymentId: $deploymentId, limit: 100) {
    message
    timestamp
  }
}
"""

dep_id = sys.argv[1] if len(sys.argv) > 1 else "70d14553-1ccf-4324-8009-93b83f13d423"
res = gql(query, {"deploymentId": dep_id})
logs = res.get("data", {}).get("deploymentLogs", [])
for l in logs[-50:]:
    print(l.get("timestamp"), l.get("message"))
