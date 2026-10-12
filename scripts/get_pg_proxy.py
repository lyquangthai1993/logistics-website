import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"
PG_SERVICE_ID = "71f92129-8a46-4a00-bc78-7149b37be9dc"
PROD_ENV_ID = "d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff"

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
query GetTcpProxies($serviceId: String!, $environmentId: String!) {
  tcpProxies(serviceId: $serviceId, environmentId: $environmentId) {
    id
    domain
    proxyPort
  }
}
"""

res = gql(query, {"serviceId": PG_SERVICE_ID, "environmentId": PROD_ENV_ID})
print("TCP Proxies for Production postgres:", json.dumps(res, indent=2))
