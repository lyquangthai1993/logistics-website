import os
import json
import urllib.request
import sys

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "")
N8N_SERVICE_ID = "ad04d45b-451e-43cd-88cf-e241ac20b178"
PROD_ENV_ID = "d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff"
DEV_ENV_ID = "9ecf5f52-2312-4be3-bb0f-bab6889f94cc"

def redeploy_service(env_id, env_name):
    query = """
    mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
    """
    req = urllib.request.Request(
        RAILWAY_API_URL,
        data=json.dumps({
            "query": query,
            "variables": {
                "serviceId": N8N_SERVICE_ID,
                "environmentId": env_id
            }
        }).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "Railway-CLI/5.23.3"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"Redeploy {env_name}:", data)
    except Exception as e:
        print(f"Error redeploying {env_name}:", e)

if __name__ == "__main__":
    env = sys.argv[1] if len(sys.argv) > 1 else "prod"
    if env == "prod" or env == "all":
        redeploy_service(PROD_ENV_ID, "Production")
    if env == "dev" or env == "all":
        redeploy_service(DEV_ENV_ID, "Dev")
