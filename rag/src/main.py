from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI

app = FastAPI(
    title="Rag Service",
)

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "FastAPI server is running"
    }
