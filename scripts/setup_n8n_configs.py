import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "")
PROJECT_ID = "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
N8N_SERVICE_ID = "ad04d45b-451e-43cd-88cf-e241ac20b178"

PROD_ENV_ID = "d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff"
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

def create_domain(env_id):
    q = """
    mutation ServiceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        domain
      }
    }
    """
    try:
        res = gql(q, {"input": {"environmentId": env_id, "serviceId": N8N_SERVICE_ID}})
        print(f"Domain for env {env_id}:", res)
        return res.get("data", {}).get("serviceDomainCreate", {}).get("domain")
    except Exception as e:
        print("Domain error:", e)
        return None

def upsert_vars(env_id, vars_dict):
    q = """
    mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }
    """
    res = gql(q, {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": env_id,
            "serviceId": N8N_SERVICE_ID,
            "variables": vars_dict
        }
    })
    print(f"Upsert vars for env {env_id}:", res)

# 1. Create domains
print("Creating domains for n8n-automation...")
prod_domain = create_domain(PROD_ENV_ID)
dev_domain = create_domain(DEV_ENV_ID)

# 2. Setup variables
n8n_vars = {
    "DB_TYPE": "postgresdb",
    "DB_POSTGRESDB_HOST": "${{postgres-tms-core.RAILWAY_PRIVATE_DOMAIN}}",
    "DB_POSTGRESDB_PORT": "5432",
    "DB_POSTGRESDB_DATABASE": "n8n_automation",
    "DB_POSTGRESDB_USER": "${{postgres-tms-core.POSTGRES_USER}}",
    "DB_POSTGRESDB_PASSWORD": "${{postgres-tms-core.POSTGRES_PASSWORD}}",
    "N8N_PORT": "5678",
    "PORT": "5678",
    "N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS": "true",
    "N8N_ENCRYPTION_KEY": "n8n_sec_key_2026_spider_express_logistics_tms",
    "GENERIC_TIMEZONE": "Asia/Ho_Chi_Minh",
    "TZ": "Asia/Ho_Chi_Minh",
    "N8N_HOST": "${{n8n-automation.RAILWAY_PUBLIC_DOMAIN}}",
    "WEBHOOK_URL": "https://${{n8n-automation.RAILWAY_PUBLIC_DOMAIN}}/",
    "N8N_PROTOCOL": "https"
}

print("Setting variables in production...")
upsert_vars(PROD_ENV_ID, n8n_vars)

print("Setting variables in dev...")
upsert_vars(DEV_ENV_ID, n8n_vars)

print("Done! Prod Domain:", prod_domain, "| Dev Domain:", dev_domain)
