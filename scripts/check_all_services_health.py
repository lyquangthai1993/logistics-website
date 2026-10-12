import os
import urllib.request
import json

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
    q_proj = """
    query {
      project(id: "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb") {
        id
        name
        environments {
          edges { node { id name } }
        }
        services {
          edges {
            node {
              id
              name
              createdAt
            }
          }
        }
      }
      deployments(input: { projectId: "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb" }) {
        edges {
          node {
            id
            status
            environmentId
            serviceId
            createdAt
            updatedAt
          }
        }
      }
    }
    """
    res = gql(q_proj)
    data = res.get("data", {})
    proj = data.get("project", {})
    deps = data.get("deployments", {}).get("edges", [])
    
    envs = {e["node"]["id"]: e["node"]["name"] for e in proj.get("environments", {}).get("edges", [])}
    svcs = {s["node"]["id"]: s["node"]["name"] for s in proj.get("services", {}).get("edges", [])}
    
    print("=" * 60)
    print(f"PROJECT: {proj.get('name')} (ID: {proj.get('id')})")
    print("=" * 60)
    print(f"Tổng số dịch vụ hiện có: {len(svcs)}")
    print(f"Môi trường: {list(envs.values())}\n")
    
    # Map latest deployment per service + env
    deploy_map = {}
    for d in deps:
        node = d["node"]
        key = (node["serviceId"], node["environmentId"])
        if key not in deploy_map:
            deploy_map[key] = node
            
    for s_id, s_name in svcs.items():
        print(f"📦 Service: {s_name} (ID: {s_id})")
        for e_id, e_name in envs.items():
            dep = deploy_map.get((s_id, e_id))
            if dep:
                status = dep["status"]
                icon = "🟢" if status == "SUCCESS" else ("🔴" if status in ["CRASHED", "FAILED"] else "🟡")
                print(f"   [{e_name}]: {icon} Status: {status} | DeployID: {dep['id']}")
            else:
                print(f"   [{e_name}]: ⚪ Chưa có Deployment (Chờ gắn Source/Docker Build)")
        print()

if __name__ == "__main__":
    main()
