import os
import urllib.request
import json

url = 'https://backboard.railway.com/graphql/v2'
token = 'os.environ.get("RAILWAY_TOKEN", "")'
req = urllib.request.Request(
    url,
    data=json.dumps({
        'query': '{ __type(name: "Mutation") { fields { name args { name type { name kind ofType { name } } } } } }'
    }).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'User-Agent': 'Railway-CLI/5.23.3'}
)
resp = urllib.request.urlopen(req, timeout=10)
fields = json.loads(resp.read().decode())['data']['__type']['fields']
del_muts = [f for f in fields if any(k in f['name'].lower() for k in ['service', 'disconnect', 'delete', 'environment', 'instance', 'deploy']) and any(k in f['name'].lower() for k in ['delete', 'remove', 'disconnect', 'stop'])]
for m in del_muts:
    print(m['name'], [a['name'] for a in m['args']])
