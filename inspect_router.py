import sys
sys.path.insert(0, 'k:\\sparklio_ai_marketing_studio\\backend')
from app.api.v1.router import api_router

print('Routes in api_router:')
for route in api_router.routes:
    if hasattr(route, 'path'):
        print(f'  {route.path}')
    if hasattr(route, 'routes'):
        for sub in route.routes[:3]:
            if hasattr(sub, 'path'):
                print(f'    - {sub.path}')
