import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"
PROJECT_ID = "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
ENV_ID = "d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff" # production

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

def upsert_variables(service_id, variables_dict):
    q = """
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
    """
    vars = {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": ENV_ID,
            "serviceId": service_id,
            "variables": variables_dict
        }
    }
    res = gql(q, vars)
    print(f"Upsert result for service {service_id}:", res)
    return res

def main():
    # 1. Link backend-tms-core to postgres-tms-core, redis-tms-core, frontend-tms-core
    backend_id = "3a17b347-f26a-41a5-aca6-634131049875"
    backend_ref_vars = {
        "DATABASE_HOST": "${{postgres-tms-core.RAILWAY_PRIVATE_DOMAIN}}",
        "DATABASE_USERNAME": "${{postgres-tms-core.POSTGRES_USER}}",
        "DATABASE_PASSWORD": "${{postgres-tms-core.POSTGRES_PASSWORD}}",
        "DATABASE_NAME": "${{postgres-tms-core.POSTGRES_DB}}",
        "DATABASE_URL": "postgresql://${{postgres-tms-core.POSTGRES_USER}}:${{postgres-tms-core.POSTGRES_PASSWORD}}@${{postgres-tms-core.RAILWAY_PRIVATE_DOMAIN}}:5432/${{postgres-tms-core.POSTGRES_DB}}",
        "REDIS_HOST": "${{redis-tms-core.RAILWAY_PRIVATE_DOMAIN}}",
        "WORKER_HOST": "redis://${{redis-tms-core.RAILWAY_PRIVATE_DOMAIN}}:6379/1",
        "FRONTEND_DOMAIN": "https://${{frontend-tms-core.RAILWAY_PUBLIC_DOMAIN}}"
    }
    print("Linking Backend variables...")
    upsert_variables(backend_id, backend_ref_vars)

    # 2. Link frontend-tms-core to backend-tms-core
    frontend_id = "e3786bc8-095c-4a36-b48e-60788af613d6"
    frontend_ref_vars = {
        "NEXT_PUBLIC_API_URL": "https://${{backend-tms-core.RAILWAY_PUBLIC_DOMAIN}}"
    }
    print("Linking Frontend variables...")
    upsert_variables(frontend_id, frontend_ref_vars)

if __name__ == "__main__":
    main()
