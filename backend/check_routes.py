#!/usr/bin/env python
"""Check registered routes"""

from app.api.v1 import router

routes = [(r.path, r.methods) for r in router.api_router.routes if hasattr(r, 'path')]
print(f"Total routes: {len(routes)}")
print("\nAdmin routes:")
for path, methods in routes:
    if 'admin' in path:
        print(f"  {methods} {path}")

print("\nAll routes:")
for path, methods in routes:
    print(f"  {methods} {path}")
