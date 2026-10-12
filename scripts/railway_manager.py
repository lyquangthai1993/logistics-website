import os
import urllib.request
import json
import sys

RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2"
DEFAULT_TOKEN = "os.environ.get("RAILWAY_TOKEN", "")"

def execute_gql(query, variables=None, token=DEFAULT_TOKEN):
    data = {"query": query}
    if variables:
        data["variables"] = variables
    
    req = urllib.request.Request(
        RAILWAY_API_URL,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "Railway-CLI/5.23.3"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"HTTPError {e.code}: {body}")
        return {"error": body, "status": e.code}
    except Exception as e:
        print(f"Exception: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "list"
    
    if action == "list":
        q = """
        query {
          projects {
            edges {
              node {
                id
                name
                description
                createdAt
                environments {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
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
          }
        }
        """
        res = execute_gql(q)
        print(json.dumps(res, indent=2))
        
    elif action == "create_project":
        name = sys.argv[2] if len(sys.argv) > 2 else "Logistics TMS - Spider Express"
        q = """
        mutation CreateProject($input: ProjectCreateInput!) {
          projectCreate(input: $input) {
            id
            name
            description
            createdAt
            environments {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        }
        """
        vars = {"input": {"name": name, "defaultEnvironmentName": "production"}}
        res = execute_gql(q, vars)
        print(json.dumps(res, indent=2))

    elif action == "create_env":
        project_id = sys.argv[2]
        env_name = sys.argv[3] if len(sys.argv) > 3 else "dev"
        q = """
        mutation CreateEnvironment($input: EnvironmentCreateInput!) {
          environmentCreate(input: $input) {
            id
            name
            projectId
          }
        }
        """
        vars = {"input": {"projectId": project_id, "name": env_name}}
        res = execute_gql(q, vars)
        print(json.dumps(res, indent=2))

    elif action == "create_service":
        project_id = sys.argv[2]
        service_name = sys.argv[3]
        image_name = sys.argv[4] if len(sys.argv) > 4 else None
        
        q = """
        mutation CreateService($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
            name
            createdAt
          }
        }
        """
        source = {"image": image_name} if image_name else None
        vars = {
            "input": {
                "projectId": project_id,
                "name": service_name,
                "source": source
            }
        }
        res = execute_gql(q, vars)
        print(json.dumps(res, indent=2))

    elif action == "create_volume":
        project_id = sys.argv[2]
        service_id = sys.argv[3]
        mount_path = sys.argv[4] if len(sys.argv) > 4 else "/app/workspace"
        
        q = """
        mutation CreateVolume($input: VolumeCreateInput!) {
          volumeCreate(input: $input) {
            id
            name
          }
        }
        """
    elif action == "setup_all_services":
        project_id = sys.argv[2] if len(sys.argv) > 2 else "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
        
        services_to_create = [
            # Group 1: Production TMS
            {"name": "redis-pro", "image": "redis:7-alpine"},
            {"name": "backend-pro", "image": None},
            {"name": "frontend-pro", "image": None},
            
            # Group 2: Development TMS
            {"name": "postgres-dev", "image": "postgres:16-alpine"},
            {"name": "redis-dev", "image": "redis:7-alpine"},
            {"name": "backend-dev", "image": None},
            {"name": "frontend-dev", "image": None},
            
            # Group 3: Automation & Cloud AI Worker
            {"name": "postgres-automation", "image": "postgres:16-alpine"},
            {"name": "n8n-automation", "image": "n8nio/n8n:latest"},
            {"name": "telegram-cloud-worker", "image": "node:20-alpine"},
        ]
        
        q = """
        mutation CreateService($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
            name
          }
        }
        """
        
        created = {}
        for s in services_to_create:
            source = {"image": s["image"]} if s["image"] else None
            vars = {
                "input": {
                    "projectId": project_id,
                    "name": s["name"],
                    "source": source
                }
            }
            res = execute_gql(q, vars)
            if "data" in res and res["data"]["serviceCreate"]:
                svc_id = res["data"]["serviceCreate"]["id"]
                created[s["name"]] = svc_id
                print(f"Created {s['name']}: {svc_id}")
            else:
                print(f"Failed to create {s['name']}: {res}")
                
        print("\nAll services created successfully!")
        print(json.dumps(created, indent=2))

    elif action == "set_variables":
        project_id = sys.argv[2]
        env_id = sys.argv[3]
        service_id = sys.argv[4]
        # sys.argv[5] is JSON string of key-value variables
        variables_dict = json.loads(sys.argv[5])
        
        q = """
        mutation VariableCollectionUpsert($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }
        """
        vars = {
            "input": {
                "projectId": project_id,
                "environmentId": env_id,
                "serviceId": service_id,
                "variables": variables_dict
            }
        }
        res = execute_gql(q, vars)
        print(json.dumps(res, indent=2))

    elif action == "create_project_token":
        project_id = sys.argv[2] if len(sys.argv) > 2 else "32cad4c1-ce12-473c-9a5d-5b3c136d0ecb"
        env_id = sys.argv[3] if len(sys.argv) > 3 else "d4b78a94-2e05-4129-ac3d-4bdcbe5d5dff"
        token_name = sys.argv[4] if len(sys.argv) > 4 else "CLI-Deploy-Token"
        
        q = """
        mutation CreateProjectToken($input: ProjectTokenCreateInput!) {
          projectTokenCreate(input: $input)
        }
        """
        vars = {
            "input": {
                "projectId": project_id,
                "environmentId": env_id,
                "name": token_name
            }
        }
        res = execute_gql(q, vars)
        print(json.dumps(res, indent=2))

    elif action == "rename_service":
        service_id = sys.argv[2]
        new_name = sys.argv[3]
        
        q = """
        mutation UpdateService($id: String!, $input: ServiceUpdateInput!) {
          serviceUpdate(id: $id, input: $input) {
            id
            name
          }
        }
        """
        vars = {
            "id": service_id,
            "input": {
                "name": new_name
            }
        }
        res = execute_gql(q, vars)
        print(json.dumps(res, indent=2))

    elif action == "build_logs":
        deployment_id = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 30
        q = """
        query BuildLogs($deploymentId: String!, $limit: Int) {
          buildLogs(deploymentId: $deploymentId, limit: $limit) {
            timestamp
            message
          }
        }
        """
        res = execute_gql(q, {"deploymentId": deployment_id, "limit": limit})
        print(json.dumps(res, indent=2))

    elif action == "deployment_meta":
        deployment_id = sys.argv[2]
        q = """
        query DeploymentMeta($id: String!) {
          deployment(id: $id) {
            id
            status
            meta
            canRedeploy
            staticUrl
          }
        }
        """
        res = execute_gql(q, {"id": deployment_id})
        print(json.dumps(res, indent=2))










