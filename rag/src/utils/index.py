from utils.load_repo import load_github_repo_fast
from utils.ingestor import chunk_and_store_in_qdrant

def loadDocAndStore(repoName, githubToken, projectId):
    docs = load_github_repo_fast(repoName, githubToken)
    chunk_and_store_in_qdrant(projectId, docs)