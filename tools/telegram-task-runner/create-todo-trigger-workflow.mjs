import fs from 'node:fs';

const BASE_URL = 'https://n8n-n0al.onrender.com';
const PG_CRED_ID = '98mf2JbtaLmz0J3J';
const TG_CRED_ID = 'TuI6c4213DQZTZ5X';

async function main() {
  const n8nEmail = process.env.N8N_EMAIL;
  const n8nPassword = process.env.N8N_PASSWORD;
  if (!n8nEmail || !n8nPassword) {
    throw new Error('Missing N8N_EMAIL or N8N_PASSWORD environment variables.');
  }

  console.log('1. Logging in to n8n...');
  const loginRes = await fetch(`${BASE_URL}/rest/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrLdapLoginId: n8nEmail,
      password: n8nPassword
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Login successful.');

  const workflowPayload = {
    name: 'Daily 12PM Todo-Agent Orchestrator',
    settings: {
      executionOrder: 'v1',
      timezone: 'Asia/Ho_Chi_Minh',
      saveExecutionProgress: true,
      saveManualExecutions: true
    },
    nodes: [
      {
        parameters: {
          rule: {
            interval: [
              {
                field: "cronExpression",
                expression: "0 12 * * *"
              }
            ]
          }
        },
        id: "schedule-trigger-node",
        name: "Schedule Trigger (12:00 PM)",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [200, 200]
      },
      {
        parameters: {},
        id: "manual-trigger-node",
        name: "Manual Trigger (On Demand)",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: [200, 360]
      },
      {
        parameters: {
          httpMethod: "POST",
          path: "trigger-todo-agent",
          responseMode: "lastNode",
          options: {}
        },
        id: "webhook-trigger-node",
        name: "Webhook Test Trigger",
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [200, 520],
        webhookId: "trigger-todo-agent"
      },
      {
        parameters: {
          operation: "executeQuery",
          query: `
SELECT 
  t.id, 
  t.feedback_dir, 
  t.raw_prompt, 
  t.sender_name, 
  t.result, 
  t.created_at, 
  t.completed_at
FROM telegram_tasks t
WHERE t.status = 'COMPLETED'
  AND t.feedback_dir IS NOT NULL
  AND t.raw_prompt NOT ILIKE '%/todo%'
  AND t.raw_prompt NOT ILIKE '%todo-agent%'
  AND NOT EXISTS (
    SELECT 1 FROM telegram_tasks a
    WHERE a.feedback_dir = t.feedback_dir
      AND (a.raw_prompt ILIKE '%todo-agent%' OR a.raw_prompt ILIKE '%/todo%')
  )
ORDER BY t.id ASC
LIMIT 1;
          `.trim()
        },
        id: "query-pending-feedback-node",
        name: "Query Pending Feedback",
        type: "n8n-nodes-base.postgres",
        typeVersion: 2.5,
        position: [460, 360],
        credentials: {
          postgres: {
            id: PG_CRED_ID,
            name: "Neon Singapore PostgreSQL"
          }
        }
      },
      {
        parameters: {
          jsCode: `
const items = $input.all();
if (!items || items.length === 0 || !items[0].json || !items[0].json.id) {
  return [{
    json: {
      has_task: false,
      chat_id: "-5509877448",
      message: "⏰ <b>[Trigger 12:00 PM]</b> Không có feedback tổng hợp nào đang chờ thực thi hôm nay."
    }
  }];
}

const item = items[0].json;
const feedbackDir = item.feedback_dir || '';
const folderName = feedbackDir.split(/[\\\\/]/).pop() || 'feedback';
const cleanPrompt = (item.raw_prompt || '').replace(/'/g, "''");
const escapedDir = feedbackDir.replace(/'/g, "''");
const sender = (item.sender_name || 'User').replace(/'/g, "''");

const todoPrompt = "/todo-agent " + cleanPrompt;
const analysis = "Kích hoạt skill /todo-agent để đọc file TODO.md trong " + escapedDir + ", đối chiếu ảnh chụp màn hình, thực thi sửa đổi mã nguồn trong các submodule (backend/ và/hoặc frontend/), tuân thủ UI Compact Density, kiểm thử build/lint và cập nhật checklist.";

const sql = "INSERT INTO telegram_tasks (chat_id, sender_name, raw_prompt, analysis, feedback_dir, status, created_at) VALUES ('-5509877448', 'Schedule Trigger (12:00 PM)', '" + todoPrompt + "', '" + analysis + "', '" + escapedDir + "', 'PENDING', NOW()) RETURNING id;";

return [{
  json: {
    has_task: true,
    chat_id: "-5509877448",
    source_id: item.id,
    sender_name: item.sender_name || 'User',
    source_prompt: item.raw_prompt || '',
    feedback_dir: feedbackDir,
    folder_name: folderName,
    sql: sql
  }
}];
          `.trim()
        },
        id: "format-todo-node",
        name: "Format Todo-Agent Task",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [700, 360]
      },
      {
        parameters: {
          conditions: {
            options: {
              caseSensitive: true,
              leftValue: "",
              typeValidation: "strict",
              version: 2
            },
            conditions: [
              {
                leftValue: "={{ $json.has_task }}",
                rightValue: true,
                operator: {
                  type: "boolean",
                  operation: "equals"
                }
              }
            ],
            combinator: "and"
          }
        },
        id: "if-has-task-node",
        name: "Has Task to Execute?",
        type: "n8n-nodes-base.if",
        typeVersion: 2.2,
        position: [920, 360]
      },
      {
        parameters: {
          operation: "executeQuery",
          query: "={{ $json.sql }}"
        },
        id: "enqueue-todo-node",
        name: "Enqueue Todo Task to DB",
        type: "n8n-nodes-base.postgres",
        typeVersion: 2.5,
        position: [1140, 260],
        credentials: {
          postgres: {
            id: PG_CRED_ID,
            name: "Neon Singapore PostgreSQL"
          }
        }
      },
      {
        parameters: {
          resource: "message",
          operation: "sendMessage",
          chatId: "={{ $('Format Todo-Agent Task').item.json.chat_id }}",
          text: `={{ \`⏰ <b>[Trigger 12:00 PM - Kích hoạt Todo Agent]</b>\\n\\n📋 <b>Bắt đầu triển khai Feedback:</b>\\n• <b>Task gốc:</b> #\${$('Format Todo-Agent Task').item.json.source_id} (\${$('Format Todo-Agent Task').item.json.sender_name})\\n• <b>Thư mục:</b> <code>\${$('Format Todo-Agent Task').item.json.folder_name}</code>\\n• <b>Nội dung:</b> <i>"\${$('Format Todo-Agent Task').item.json.source_prompt.slice(0, 150)}\${$('Format Todo-Agent Task').item.json.source_prompt.length > 150 ? '...' : ''}"</i>\\n\\n🚀 <b>Hành động:</b> Đã đẩy <b>Task #\${$json.id}</b> (<code>/todo-agent</code>) vào hàng đợi!\\n💻 <b>Tiến trình:</b> Local Worker trên laptop sẽ tự động bốc task và bắt đầu:\\n  1️⃣ Đọc <code>TODO.md</code> và đối chiếu ảnh lỗi.\\n  2️⃣ Thực thi code trong <code>backend/</code> và <code>frontend/</code>.\\n  3️⃣ Kiểm tra build, typecheck và cập nhật <code>- [x]</code>.\\n  4️⃣ Báo cáo Git Diff về nhóm Telegram.\` }}`,
          additionalFields: {
            parse_mode: "HTML"
          }
        },
        id: "notify-tg-success-node",
        name: "Notify Telegram Success",
        type: "n8n-nodes-base.telegram",
        typeVersion: 1.2,
        position: [1360, 260],
        credentials: {
          telegramApi: {
            id: TG_CRED_ID,
            name: "Telegram Bot Account"
          }
        }
      },
      {
        parameters: {
          resource: "message",
          operation: "sendMessage",
          chatId: "={{ $json.chat_id }}",
          text: "={{ $json.message }}",
          additionalFields: {
            parse_mode: "HTML"
          }
        },
        id: "notify-tg-no-task-node",
        name: "Notify Telegram No Tasks",
        type: "n8n-nodes-base.telegram",
        typeVersion: 1.2,
        position: [1140, 480],
        credentials: {
          telegramApi: {
            id: TG_CRED_ID,
            name: "Telegram Bot Account"
          }
        }
      }
    ],
    connections: {
      "Schedule Trigger (12:00 PM)": {
        main: [
          [
            {
              node: "Query Pending Feedback",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Manual Trigger (On Demand)": {
        main: [
          [
            {
              node: "Query Pending Feedback",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Webhook Test Trigger": {
        main: [
          [
            {
              node: "Query Pending Feedback",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Query Pending Feedback": {
        main: [
          [
            {
              node: "Format Todo-Agent Task",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Format Todo-Agent Task": {
        main: [
          [
            {
              node: "Has Task to Execute?",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Has Task to Execute?": {
        main: [
          [
            {
              node: "Enqueue Todo Task to DB",
              type: "main",
              index: 0
            }
          ],
          [
            {
              node: "Notify Telegram No Tasks",
              type: "main",
              index: 0
            }
          ]
        ]
      },
      "Enqueue Todo Task to DB": {
        main: [
          [
            {
              node: "Notify Telegram Success",
              type: "main",
              index: 0
            }
          ]
        ]
      }
    }
  };

  console.log('2. Creating workflow on n8n...');
  const createRes = await fetch(`${BASE_URL}/rest/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify(workflowPayload)
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Failed to create workflow: ${JSON.stringify(createData)}`);
  }
  const wfId = createData.data?.id;
  console.log('Workflow created successfully! ID:', wfId);

  console.log('3. Activating workflow...');
  const actRes = await fetch(`${BASE_URL}/rest/workflows/${wfId}/activate`, {
    method: 'POST',
    headers: { 'Cookie': cookie }
  });
  const actData = await actRes.json();
  console.log('Activation status:', actRes.status, 'Active state:', actData.data?.active);

  console.log(`\n🎉 Workflow "Daily 12PM Todo-Agent Orchestrator" is LIVE on n8n! ID: ${wfId}`);
}

main().catch(console.error);
