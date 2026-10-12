import subprocess

cmd = [
    'C:/Program Files/PostgreSQL/17/bin/psql.exe',
    '-h', 'caboose.proxy.rlwy.net',
    '-p', '59375',
    '-U', 'postgres',
    '-d', 'n8n_automation',
    '-c', 'SELECT id, email, "firstName", "lastName" FROM public."user";'
]
out = subprocess.check_output(cmd, env={'PGPASSWORD': 'logistics_tms_2026_pwd'})
print(out.decode())
