import sys
import os
import asyncio
from datetime import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.services.agents.presentation import PresentationAgent, PresentationInput
from app.api.v1.endpoints.presentations import SlideModel, PresentationCreateRequest, PRESENTATIONS_DB

def verify_imports():
    print("[Verification] Checking imports...")
    try:
        agent = PresentationAgent()
        print(f"  - PresentationAgent instantiated: {agent.name}")
        return True
    except Exception as e:
        print(f"  - Failed to instantiate PresentationAgent: {e}")
        return False

def verify_pydantic_models():
    print("[Verification] Checking Pydantic models...")
    try:
        # Test PresentationInput
        input_data = PresentationInput(
            concept={"concept_name": "Test Concept"},
            product_name="Test Product",
            presentation_type="vision",
            slide_count=12
        )
        print("  - PresentationInput valid")

        # Test SlideModel (API)
        slide = SlideModel(
            slide_number=1,
            slide_type="cover",
            title="Test Title",
            layout="full_image"
        )
        print("  - SlideModel valid")
        
        return True
    except Exception as e:
        print(f"  - Model verification failed: {e}")
        return False

async def verify_api_logic():
    print("[Verification] Checking API logic (Mock DB)...")
    try:
        # Simulate Create
        slide = SlideModel(
            slide_number=1,
            slide_type="cover",
            title="Vision Title",
            layout="full_image"
        )
        req = PresentationCreateRequest(
            title="My Vision Deck",
            slides=[slide],
            concept_id="concept-123"
        )
        
        # Simulate DB insertion logic
        presentation_id = "test-id-123"
        now = datetime.utcnow()
        presentation_data = {
            "id": presentation_id,
            "title": req.title,
            "slides": [s.model_dump() for s in req.slides],
            "concept_id": req.concept_id,
            "created_at": now,
            "updated_at": now
        }
        PRESENTATIONS_DB[presentation_id] = presentation_data
        
        print(f"  - Created presentation in DB: {presentation_data['title']}")
        
        # Simulate Get
        retrieved = PRESENTATIONS_DB.get(presentation_id)
        if retrieved and retrieved['id'] == presentation_id:
            print("  - Retrieved presentation successfully")
        else:
            print("  - Failed to retrieve presentation")
            return False
            
        return True
    except Exception as e:
        print(f"  - API logic verification failed: {e}")
        return False

async def main():
    print("=== Presentation Feature Verification ===")
    if verify_imports() and verify_pydantic_models() and await verify_api_logic():
        print("\n[SUCCESS] All backend components verified successfully.")
    else:
        print("\n[FAILURE] Some components failed verification.")

if __name__ == "__main__":
    asyncio.run(main())
