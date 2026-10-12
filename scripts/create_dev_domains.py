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

# Generate or get domain for backend in dev
def generate_domain(service_id):
    q = """
    mutation ServiceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) {
        domain
      }
    }
    """
    vars = {"input": {"environmentId": DEV_ENV_ID, "serviceId": service_id}}
    try:
        res = gql(q, vars)
        print(f"Domain for {service_id}:", res)
        return res.get("data", {}).get("serviceDomainCreate", {}).get("domain")
    except Exception as e:
        print(f"Domain error for {service_id}:", e)
        return None

backend_id = "3a17b347-f26a-41a5-aca6-634131049875"
frontend_id = "e3786bc8-095c-4a36-b48e-60788af613d6"

print("Creating domains for DEV...")
b_dom = generate_domain(backend_id)
f_dom = generate_domain(frontend_id)
print(f"DEV Backend Domain: {b_dom}")
print(f"DEV Frontend Domain: {f_dom}")
