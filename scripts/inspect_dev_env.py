import os
import json
import urllib.request

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"
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
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("HTTPError:", e.read().decode("utf-8"))
        return {}
    except Exception as e:
        print("Error:", e)
        return {}

def main():
    q = """
    query DevInspect($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              id
              name
            }
          }
        }
        volumes {
          edges {
            node {
              id
              name
              volumeInstances {
                edges {
                  node {
                    id
                    environmentId
                    serviceId
                    mountPath
                    state
                  }
                }
              }
            }
          }
        }
      }
    }
    """
    res = gql(q, {"projectId": PROJECT_ID, "envId": DEV_ENV_ID})
    print("Project info:")
    print(json.dumps(res, indent=2))

    # Also query variables in dev
    services = {s["node"]["name"]: s["node"]["id"] for s in res.get("data", {}).get("project", {}).get("services", {}).get("edges", [])}
    for name, s_id in services.items():
        q_vars = """
        query Vars($projectId: String!, $envId: String!, $serviceId: String!) {
          variables(projectId: $projectId, environmentId: $envId, serviceId: $serviceId)
        }
        """
        vars_res = gql(q_vars, {"projectId": PROJECT_ID, "envId": DEV_ENV_ID, "serviceId": s_id})
        v_dict = vars_res.get("data", {}).get("variables", {})
        print(f"\n--- DEV: {name} ({len(v_dict)} vars) ---")
        for k, v in v_dict.items():
            if "PASS" in k or "SECRET" in k:
                val = "***"
            else:
                val = v
            print(f"  {k} = {val}")

if __name__ == "__main__":
    main()
