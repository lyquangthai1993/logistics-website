import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "")
PROJECT_ID = "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
ENV_ID = "d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff"
SERVICE_ID = "71f92129-8a46-4a00-bc78-7149b37be9dc" # postgres-tms-core

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
mutation VariableUpsert($input: VariableUpsertInput!) {
  variableUpsert(input: $input)
}
"""
vars = {
  "input": {
    "projectId": PROJECT_ID,
    "environmentId": ENV_ID,
    "serviceId": SERVICE_ID,
    "name": "PGDATA",
    "value": "/var/lib/postgresql/data/pgdata"
  }
}

res = gql(q, vars)
print("VariableUpsert PGDATA result:", res)
