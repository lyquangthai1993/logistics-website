import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "")
N8N_SERVICE_ID = "ad04d45b-451e-43cd-88cf-e241ac20b178"

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
query GetDeploys($serviceId: String!) {
  service(id: $serviceId) {
    deployments(first: 6) {
      edges {
        node {
          id
          status
          environmentId
          createdAt
        }
      }
    }
  }
}
"""

res = gql(query, {"serviceId": N8N_SERVICE_ID})
print(json.dumps(res, indent=2))
