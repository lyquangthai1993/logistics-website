import os
import urllib.request
import json

url = 'https://backboard.railway.com/graphql/v2'
token = 'os.environ.get("RAILWAY_TOKEN", "")'
req = urllib.request.Request(
    url,
    data=json.dumps({
        'query': '{ __type(name: "Mutation") { fields { name args { name type { name kind ofType { name } } description } } } }'
    }).encode(),
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'User-Agent': 'Railway-CLI/5.23.3'}
)
resp = urllib.request.urlopen(req, timeout=10)
fields = json.loads(resp.read().decode())['data']['__type']['fields']
s_del = next(f for f in fields if f['name'] == 'serviceDelete')
print(json.dumps(s_del, indent=2))
