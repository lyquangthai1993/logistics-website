import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "") # PAT
SERVICE_ID = "2a78a763-ca47-45cc-be69-de6ca26c1193" # postgres-n8n-automation

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

q = """
mutation DeleteService($id: String!) {
  serviceDelete(id: $id)
}
"""
res = gql(q, {"id": SERVICE_ID})
print("serviceDelete result:", json.dumps(res, indent=2))
