from github import Github
from langchain_core.documents import Document
from typing import List, Tuple

def load_github_repo_fast(
    repo_name: str,
    token: str,
    branch: str = "main",
    code_extensions: Tuple[str, ...] = (
        ".py", ".js", ".ts", ".tsx", ".jsx", ".java",
        ".cpp", ".c", ".go", ".rs", ".html", ".css"
    ),
) -> List[Document]:
    
    paths= get_github_files(repo_name,token,branch,code_extensions)

    docs = []
    for file in paths:
        try:
            content = file.decoded_content.decode("utf-8")
            docs.append(Document(
                page_content=content,
                metadata={
                    "path": file.path,
                    "sha": file.sha,
                    "source": file.html_url,
                }
            ))
        except UnicodeDecodeError:
            print(f"⚠️ Skipping non-UTF8 file: {file.path}")

    print(f"📄 Loaded {len(docs)} documents successfully.")
    return docs


def get_github_files(repo_name: str,
    token: str,
    branch: str = "main",
    code_extensions: Tuple[str, ...] = (
        ".py", ".js", ".ts", ".tsx", ".jsx", ".java",
        ".cpp", ".c", ".go", ".rs", ".html", ".css"
    )):
    g = Github(token)
    repo = g.get_repo(repo_name)
    paths = []

    def collect_files(path=""):
        contents = repo.get_contents(path, ref=branch)
        for item in contents:
            if item.type == "dir":
                collect_files(item.path)
            elif item.path.endswith(code_extensions):
                paths.append(item)

    print(f"🔍 Scanning repository: {repo_name} ({branch}) ...")
    collect_files()
    print(f"✅ Found {len(paths)} code files to load.")
    return paths