"""Test layout import"""
import sys
sys.path.insert(0, 'k:\\sparklio_ai_marketing_studio\\backend')

try:
    from app.api.v1.endpoints import layout
    print('Import OK')
    print('Router:', layout.router)
    print('Routes:', [r.path for r in layout.router.routes])
except Exception as e:
    print(f'Import Error: {e}')
    import traceback
    traceback.print_exc()
