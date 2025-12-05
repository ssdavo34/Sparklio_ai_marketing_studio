import requests
import json

r = requests.get('http://localhost:8000/openapi.json')
data = r.json()

print('All API paths:')
for p in sorted(data['paths'].keys()):
    print(f'  {p}')

# Check if layout exists
layout_paths = [p for p in data['paths'].keys() if 'layout' in p.lower()]
print(f'\nLayout paths: {layout_paths}')
