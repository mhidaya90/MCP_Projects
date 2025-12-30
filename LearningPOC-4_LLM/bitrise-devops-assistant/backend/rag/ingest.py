
# backend/rag/ingest.py
import os, glob
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

def build_index(log_dir="data/logs"):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=120)
    embed = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    texts, metas = [], []
    for path in glob.glob(os.path.join(log_dir, "*.log")):
        with open(path, "r", encoding="utf-8") as f:
            chunks = splitter.split_text(f.read())
            texts += chunks; metas += [{"source": path}] * len(chunks)
    vs = FAISS.from_texts(texts, embed, metadatas=metas)
    vs.save_local("rag_index")
if __name__ == "__main__":
    build_index()