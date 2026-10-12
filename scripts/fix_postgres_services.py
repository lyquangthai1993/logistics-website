import os
import urllib.request
import json
import time

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

def main():
    # 1. Inspect VariableCollectionUpsertInput
    q_type = """
    query {
      __type(name: "VariableCollectionUpsertInput") {
        name
        inputFields {
          name
          type { name kind ofType { name kind } }
        }
      }
    }
    """
    res = gql(q_type)
    print("VariableCollectionUpsertInput:", json.dumps(res, indent=2))

    # Environments:
    # dev: 9ecf5f52-2312-4be3-bb0f-bab6889f94cc
    # production: d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff
    
    # postgres-pro: 71f92129-8a46-4a00-bc78-7149b37be9dc
    # postgres-dev: 2a78a763-ca47-45cc-be69-de6ca26c1193

    q_upsert = """
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
    """

    # Set variables for postgres-pro in both envs
    for env_id, env_name in [("d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff", "production"), ("9ecf5f52-2312-4be3-bb0f-bab6889f94cc", "dev")]:
        gql(q_upsert, {
            "input": {
                "projectId": PROJECT_ID,
                "environmentId": env_id,
                "serviceId": "71f92129-8a46-4a00-bc78-7149b37be9dc",
                "variables": {
                    "POSTGRES_USER": "postgres",
                    "POSTGRES_PASSWORD": "postgres_tms_2026_pro",
                    "POSTGRES_DB": "logistics_tms_pro"
                }
            }
        })
        gql(q_upsert, {
            "input": {
                "projectId": PROJECT_ID,
                "environmentId": env_id,
                "serviceId": "2a78a763-ca47-45cc-be69-de6ca26c1193",
                "variables": {
                    "POSTGRES_USER": "postgres",
                    "POSTGRES_PASSWORD": "postgres_tms_2026_dev",
                    "POSTGRES_DB": "logistics_tms_dev"
                }
            }
        })
    print("All postgres variables configured!")

if __name__ == "__main__":
    main()
