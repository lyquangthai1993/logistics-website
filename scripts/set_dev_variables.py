import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"
PROJECT_ID = "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
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

def upsert_variables(service_id, variables_dict):
    q = """
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
    """
    vars = {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": DEV_ENV_ID,
            "serviceId": service_id,
            "variables": variables_dict
        }
    }
    res = gql(q, vars)
    print(f"Upsert result for service {service_id}:", res)
    return res

backend_id = "3a17b347-f26a-41a5-aca6-634131049875"
frontend_id = "e3786bc8-095c-4a36-b48e-60788af613d6"

backend_vars = {
    "BACKEND_DOMAIN": "https://${{backend-tms-core.RAILWAY_PUBLIC_DOMAIN}}",
    "FRONTEND_DOMAIN": "https://${{frontend-tms-core.RAILWAY_PUBLIC_DOMAIN}}",
    "APP_CORS_ORIGINS": "https://frontend-tms-core-dev.up.railway.app,http://localhost:3000,http://localhost:4000",
    "DATABASE_HOST": "${{postgres-tms-core.RAILWAY_PRIVATE_DOMAIN}}",
    "DATABASE_USERNAME": "${{postgres-tms-core.POSTGRES_USER}}",
    "DATABASE_PASSWORD": "${{postgres-tms-core.POSTGRES_PASSWORD}}",
    "DATABASE_NAME": "${{postgres-tms-core.POSTGRES_DB}}",
    "DATABASE_URL": "postgresql://${{postgres-tms-core.POSTGRES_USER}}:${{postgres-tms-core.POSTGRES_PASSWORD}}@${{postgres-tms-core.RAILWAY_PRIVATE_DOMAIN}}:5432/${{postgres-tms-core.POSTGRES_DB}}",
    "REDIS_HOST": "${{redis-tms-core.RAILWAY_PRIVATE_DOMAIN}}",
    "WORKER_HOST": "redis://${{redis-tms-core.RAILWAY_PRIVATE_DOMAIN}}:6379/1"
}

frontend_vars = {
    "NEXT_PUBLIC_API_URL": "https://${{backend-tms-core.RAILWAY_PUBLIC_DOMAIN}}"
}

print("Setting DEV Backend variables...")
upsert_variables(backend_id, backend_vars)

print("Setting DEV Frontend variables...")
upsert_variables(frontend_id, frontend_vars)
