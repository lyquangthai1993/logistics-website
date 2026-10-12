import os
import urllib.request
import json

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"
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
    q_upsert = """
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
    """

    # 1. postgres-tms-core (71f92129-8a46-4a00-bc78-7149b37be9dc)
    print("Setting variables for postgres-tms-core...")
    for env_id in ["d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff", "9ecf5f52-2312-4be3-bb0f-bab6889f94cc"]:
        gql(q_upsert, {
            "input": {
                "projectId": PROJECT_ID,
                "environmentId": env_id,
                "serviceId": "71f92129-8a46-4a00-bc78-7149b37be9dc",
                "variables": {
                    "POSTGRES_USER": "postgres",
                    "POSTGRES_PASSWORD": "logistics_tms_2026_pwd",
                    "POSTGRES_DB": "logistics_tms_core"
                }
            }
        })

    # 2. postgres-n8n-automation (2a78a763-ca47-45cc-be69-de6ca26c1193)
    print("Setting variables for postgres-n8n-automation...")
    for env_id in ["d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff", "9ecf5f52-2312-4be3-bb0f-bab6889f94cc"]:
        gql(q_upsert, {
            "input": {
                "projectId": PROJECT_ID,
                "environmentId": env_id,
                "serviceId": "2a78a763-ca47-45cc-be69-de6ca26c1193",
                "variables": {
                    "POSTGRES_USER": "postgres",
                    "POSTGRES_PASSWORD": "n8n_automation_2026_pwd",
                    "POSTGRES_DB": "n8n_automation"
                }
            }
        })

    print("Database variables successfully updated!")

if __name__ == "__main__":
    main()
