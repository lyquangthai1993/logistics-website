import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.loadEnvFile(path.join(__dirname, '.env'));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  console.log('Connected to Neon DB.');

  const wf = await client.query('SELECT nodes, connections FROM workflow_entity WHERE id = $1', ['IL2EeeayDVec4jHl']);
  const nodes = wf.rows[0].nodes;
  const connections = wf.rows[0].connections;
  console.log('Nodes in workflow_entity:', nodes.map(n => n.name));

  const pub = await client.query('SELECT "publishedVersionId" FROM workflow_published_version WHERE "workflowId" = $1', ['IL2EeeayDVec4jHl']);
  const versionId = pub.rows[0].publishedVersionId;
  console.log('Current publishedVersionId:', versionId);

  // Cập nhật version đang chạy (published version) trong workflow_history
  const res = await client.query(
    'UPDATE workflow_history SET nodes = $1, connections = $2 WHERE "versionId" = $3',
    [JSON.stringify(nodes), JSON.stringify(connections), versionId]
  );
  console.log('Updated workflow_history rows:', res.rowCount);

  // Xóa task 33 thử nghiệm vừa sinh ra nếu có
  const delRes = await client.query("DELETE FROM telegram_tasks WHERE id = 33 OR raw_prompt LIKE 'Tin nhắn thử nghiệm%';");
  console.log('Cleaned test tasks:', delRes.rowCount);

  await client.end();
  console.log('Done!');
}

run().catch(console.error);
