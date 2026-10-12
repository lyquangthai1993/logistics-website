import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = os.environ.get("RAILWAY_TOKEN", "")
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

def get_variables(service_id):
    q = """
    query Variables($projectId: String!, $environmentId: String!, $serviceId: String!) {
      variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
    }
    """
    res = gql(q, {"projectId": PROJECT_ID, "environmentId": ENV_ID, "serviceId": service_id})
    return res.get("data", {}).get("variables", {})

def main():
    q_services = """
    query {
      project(id: "%s") {
        services {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
    """ % PROJECT_ID
    
    res = gql(q_services)
    services = {s["node"]["name"]: s["node"]["id"] for s in res["data"]["project"]["services"]["edges"]}
    print("Services found:", services)
    
    for name, s_id in services.items():
        vars = get_variables(s_id)
        print(f"\n--- {name} ({s_id}) ---")
        for k, v in vars.items():
            # mask secret values
            if "PASS" in k or "SECRET" in k or "KEY" in k:
                val = v[:3] + "..." + v[-3:] if len(v) > 6 else "***"
            else:
                val = v
            print(f"  {k} = {val}")

if __name__ == "__main__":
    main()
