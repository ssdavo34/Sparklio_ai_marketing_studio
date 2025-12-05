"""Test full router"""
import sys
sys.path.insert(0, 'k:\\sparklio_ai_marketing_studio\\backend')

try:
    from app.api.v1.router import api_router
    print('Router OK')
    print(f'Total routes: {len(api_router.routes)}')

    # Find layout routes
    layout_routes = [r for r in api_router.routes if hasattr(r, 'path') and 'layout' in r.path]
    print(f'Layout routes: {[r.path for r in layout_routes]}')

    # Check for sub-routers
    for route in api_router.routes:
        if hasattr(route, 'routes'):
            sub_paths = [r.path for r in route.routes if hasattr(r, 'path')]
            if any('generate' in p for p in sub_paths):
                print(f'Sub-router at {route.path}: {sub_paths[:3]}...')

except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
