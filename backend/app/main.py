from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import EMPRESA_NOME
from .routers import auth, produtos, vendas, saude, nf, vitrine, clientes

# Schema é responsabilidade do Alembic (entrypoint roda `alembic upgrade head`).
app = FastAPI(title="Hazak API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(produtos.router)
app.include_router(clientes.router)
app.include_router(vendas.router)
app.include_router(saude.router)
app.include_router(nf.router)
app.include_router(vitrine.router)


@app.get("/")
def raiz():
    return {"app": "Hazak", "empresa": EMPRESA_NOME, "status": "ok"}


@app.get("/api/config")
def config_publica():
    return {"empresa_nome": EMPRESA_NOME}
