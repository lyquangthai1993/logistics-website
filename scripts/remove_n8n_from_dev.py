import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"
N8N_SERVICE_ID = "ad04d45b-451e-43cd-88cf-e241ac20b178"
DEV_ENV_ID = "9ecf5f52-2312-4be3-bb0f-bab6889f94cc"

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
mutation DeleteServiceFromDev($serviceId: String!, $environmentId: String!) {
  serviceDelete(id: $serviceId, environmentId: $environmentId)
}
"""

res = gql(query, {"serviceId": N8N_SERVICE_ID, "environmentId": DEV_ENV_ID})
print("Result of deleting n8n from Dev:", res)
