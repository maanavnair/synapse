from dotenv import load_dotenv
from pathlib import Path
import os, uuid, hashlib
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from qdrant_client.http.models import VectorParams, Distance, PayloadSchemaType

load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")


qdrantClient = QdrantClient(
    url=os.getenv("QDRANT_HOSTP"),
    api_key=os.getenv("QDRANT_API_KEY"),
    timeout=60.0 
)

def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def chunk_and_store_in_qdrant(project_id: str, documents: list):
    print(f"🧩 Splitting {len(documents)} documents for project: {project_id} ...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_documents(documents)
    print(f"✅ Created {len(chunks)} chunks from {len(documents)} files.")

    # Create collection if not exists
    if not qdrantClient.collection_exists("repo"):
        qdrantClient.create_collection(
            collection_name="repo",
            vectors_config=VectorParams(size=3072, distance=Distance.COSINE)
        )
        
        
    # Embed all chunks at once (faster)
    vectors = embeddings.embed_documents([chunk.page_content for chunk in chunks])

    # Prepare points
    points = []
    for vector, doc in zip(vectors, chunks):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "projectId": project_id,  # moved to root
                    "path": doc.metadata.get("path", ""),
                    "sha": doc.metadata.get("sha", ""),
                    "source": doc.metadata.get("source", ""),
                    "hash": hash_text(doc.page_content),
                    "page_content": doc.page_content,
                },
            )
        )

    print(f"📦 Uploading {len(points)} vectors for {project_id} to Qdrant...")
    BATCH_SIZE = 5
    for i in range(0, len(points), BATCH_SIZE):
        batch = points[i:i+BATCH_SIZE]
        qdrantClient.upsert(collection_name="repo", points=batch)
        print(f"✅ Uploaded batch {i//BATCH_SIZE + 1} ({len(batch)} vectors)")

    print(f"✅ Successfully stored vectors for project: {project_id}.")
    
    
    
