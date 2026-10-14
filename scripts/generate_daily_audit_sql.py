import json
import os

wf_path = "tools/n8n-workflows/tms-daily-rbac-audit.json"
with open(wf_path, "r", encoding="utf-8") as f:
    wf = json.load(f)

wf_id = "M1IVf9rAsyFD5TYq"
wf_version_id = "0194e82b-8a8f-4318-912a-0a2a4ffc0006"
project_id = "aZdhMR9dMrOWDfys"

name = wf["name"]
nodes = json.dumps(wf["nodes"], ensure_ascii=False).replace("'", "''")
connections = json.dumps(wf["connections"], ensure_ascii=False).replace("'", "''")
settings = json.dumps(wf.get("settings", {}), ensure_ascii=False).replace("'", "''")

sql = f"""-- Workflow 3: {name} (10:00 PM Daily RBAC Audit)
DELETE FROM shared_workflow WHERE "workflowId" = '{wf_id}';
DELETE FROM webhook_entity WHERE "workflowId" = '{wf_id}';
DELETE FROM workflow_entity WHERE id = '{wf_id}';

INSERT INTO workflow_entity (
    id, name, active, nodes, connections, settings, "versionId", "triggerCount", "nodeGroups"
) VALUES (
    '{wf_id}', '{name}', true, '{nodes}'::json, '{connections}'::json, '{settings}'::json, '{wf_version_id}', 1, '[]'::json
);

INSERT INTO shared_workflow ("workflowId", "projectId", role)
VALUES ('{wf_id}', '{project_id}', 'workflow:owner');
"""

sql_file = "tools/n8n-workflows/insert_daily_rbac_audit_workflow.sql"
with open(sql_file, "w", encoding="utf-8") as f:
    f.write(sql)

print(f"Generated {sql_file} successfully!")
