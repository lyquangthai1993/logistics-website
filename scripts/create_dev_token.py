import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "") # PAT for account
PROJECT_ID = "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
DEV_ENV_ID = "9ecf5f52-2312-4be3-bb0f-bab6889f94cc" # dev

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
mutation CreateProjectToken($input: ProjectTokenCreateInput!) {
  projectTokenCreate(input: $input)
}
"""
vars = {
    "input": {
        "projectId": PROJECT_ID,
        "environmentId": DEV_ENV_ID,
        "name": "CLI-Dev-Deploy-Token"
    }
}
res = gql(q, vars)
print("DEV Token result:", json.dumps(res, indent=2))
