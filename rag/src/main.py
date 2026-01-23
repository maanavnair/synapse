from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from utils.chat import retriever
from utils.load_repo import get_github_files
from utils.qdrant_init import ensure_project_id_index
import os

app = FastAPI(
    title="Rag Service",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    projectId: str

@app.on_event("startup")
def startup_event():
    ensure_project_id_index()

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "FastAPI server is running"
    }
@app.post("/query")
def query_repo(request: QueryRequest):
    try:
        print(request.query, request.projectId)
        answer = retriever(request.query,request.projectId )
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CostRequest(BaseModel):
    repoName: str
    accessToken: str

@app.get("/cost")
def repo_files(repoName: str, accessToken: str ):
    try:
        access_token = accessToken or os.getenv("GITHUB_TOKEN")
        files = get_github_files(repoName, access_token)
        return {"cost": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))