import os
import urllib.request
import json

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "")
PROJECT_ID = "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
PROD_ENV_ID = "d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff"
BACKEND_SVC_ID = "3a17b347-f26a-41a5-aca6-634131049875"
FRONTEND_SVC_ID = "e3786bc8-095c-4a36-b48e-60788af613d6"

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

    backend_vars = {
        "NODE_ENV": "production",
        "PORT": "3001",
        "APP_PORT": "3001",
        "APP_NAME": "Logistics TMS API",
        "API_PREFIX": "api",
        "APP_FALLBACK_LANGUAGE": "vi",
        "APP_HEADER_LANGUAGE": "x-custom-lang",
        "BACKEND_DOMAIN": "https://backend-tms-core-production.up.railway.app",
        "FRONTEND_DOMAIN": "https://frontend-tms-core-production.up.railway.app",
        "APP_CORS_ORIGINS": "https://frontend-tms-core-production.up.railway.app,http://localhost:3000,http://localhost:4000",
        "DATABASE_TYPE": "postgres",
        "DATABASE_URL": "postgresql://postgres:logistics_tms_2026_pwd@postgres-tms-core.railway.internal:5432/logistics_tms_core",
        "DATABASE_HOST": "postgres-tms-core.railway.internal",
        "DATABASE_PORT": "5432",
        "DATABASE_USERNAME": "postgres",
        "DATABASE_PASSWORD": "logistics_tms_2026_pwd",
        "DATABASE_NAME": "logistics_tms_core",
        "DATABASE_SYNCHRONIZE": "false",
        "DATABASE_SSL_ENABLED": "false",
        "WORKER_HOST": "redis://redis-tms-core.railway.internal:6379/1",
        "REDIS_HOST": "redis-tms-core.railway.internal",
        "REDIS_PORT": "6379",
        "AUTH_JWT_SECRET": "4f9b8c7d6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c",
        "AUTH_JWT_TOKEN_EXPIRES_IN": "1d",
        "AUTH_REFRESH_SECRET": "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
        "AUTH_REFRESH_TOKEN_EXPIRES_IN": "30d",
        "AUTH_FORGOT_SECRET": "3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d",
        "AUTH_FORGOT_TOKEN_EXPIRES_IN": "30m",
        "AUTH_CONFIRM_EMAIL_SECRET": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        "AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN": "1d",
        "AUTH_UNIFORM_ERRORS": "true",
        "FILE_DRIVER": "local"
    }

    frontend_vars = {
        "NODE_ENV": "production",
        "PORT": "3000",
        "NEXT_PUBLIC_API_URL": "https://backend-tms-core-production.up.railway.app"
    }

    print("Configuring variables for backend-tms-core...")
    res_b = gql(q_upsert, {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": PROD_ENV_ID,
            "serviceId": BACKEND_SVC_ID,
            "variables": backend_vars
        }
    })
    print("Backend result:", res_b)

    print("Configuring variables for frontend-tms-core...")
    res_f = gql(q_upsert, {
        "input": {
            "projectId": PROJECT_ID,
            "environmentId": PROD_ENV_ID,
            "serviceId": FRONTEND_SVC_ID,
            "variables": frontend_vars
        }
    })
    print("Frontend result:", res_f)

if __name__ == "__main__":
    main()
