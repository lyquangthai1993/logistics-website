import json
import uuid
import subprocess
import os

PROJECT_ID = "wBOy4OeWDn3pMwEF"

wf1_path = "tools/n8n-workflows/tms-webhook-to-telegram.json"
wf2_path = "tools/n8n-workflows/tms-events-router.json"

with open(wf1_path, "r", encoding="utf-8") as f:
    wf1 = json.load(f)

with open(wf2_path, "r", encoding="utf-8") as f:
    wf2 = json.load(f)

wf1_id = "0194e82b-8a8f-4318-912a-0a2a4ffc0001"
wf1_version_id = "0194e82b-8a8f-4318-912a-0a2a4ffc0002"

wf2_id = "0194e82b-8a8f-4318-912a-0a2a4ffc0003"
wf2_version_id = "0194e82b-8a8f-4318-912a-0a2a4ffc0004"

def make_insert(wf, wf_id, v_id):
    name = wf["name"]
    nodes = json.dumps(wf["nodes"], ensure_ascii=False).replace("'", "''")
    connections = json.dumps(wf["connections"], ensure_ascii=False).replace("'", "''")
    settings = json.dumps(wf.get("settings", {}), ensure_ascii=False).replace("'", "''")
    
    sql = f"""
    -- Workflow: {name}
    DELETE FROM shared_workflow WHERE "workflowId" = '{wf_id}';
    DELETE FROM workflow_entity WHERE id = '{wf_id}';
    
    INSERT INTO workflow_entity (
        id, name, active, nodes, connections, settings, "versionId", "triggerCount", "nodeGroups"
    ) VALUES (
        '{wf_id}', '{name}', true, '{nodes}'::json, '{connections}'::json, '{settings}'::json, '{v_id}', 1, '[]'::json
    );
    
    INSERT INTO shared_workflow ("workflowId", "projectId", role)
    VALUES ('{wf_id}', '{PROJECT_ID}', 'workflow:owner');
    """
    return sql

sql_content = make_insert(wf1, wf1_id, wf1_version_id) + "\n" + make_insert(wf2, wf2_id, wf2_version_id)

sql_file = "tools/n8n-workflows/insert_workflows.sql"
with open(sql_file, "w", encoding="utf-8") as f:
    f.write(sql_content)

print(f"Generated {sql_file} successfully!")
