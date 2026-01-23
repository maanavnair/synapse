import os
from qdrant_client import QdrantClient
from qdrant_client.models import PayloadSchemaType
from dotenv import load_dotenv

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_HOSTP")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "repo"
FIELD_NAME = "projectId"

def ensure_project_id_index():
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
    )

    collection_info = client.get_collection(COLLECTION_NAME)
    payload_schema = collection_info.payload_schema or {}

    if FIELD_NAME in payload_schema:
        print("✅ Qdrant payload index already exists for 'projectId'")
        return

    print("⚙️ Creating Qdrant payload index for 'projectId'...")

    client.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name=FIELD_NAME,
        field_schema=PayloadSchemaType.UUID,
    )

    print("✅ Qdrant payload index created successfully")
