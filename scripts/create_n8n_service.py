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
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))

q = """
mutation CreateService($input: ServiceCreateInput!) {
  serviceCreate(input: $input) {
    id
    name
    createdAt
  }
}
"""
vars = {
    "input": {
        "projectId": PROJECT_ID,
        "name": "n8n-automation",
        "source": {
            "image": "n8nio/n8n:latest"
        }
    }
}

res = gql(q, vars)
print("CreateService n8n result:", json.dumps(res, indent=2))
