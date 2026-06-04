import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://hazak:hazak@localhost:5432/hazak",
)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-trocar")
JWT_ALG = "HS256"
JWT_EXPIRA_HORAS = 24 * 7  # 7 dias
EMPRESA_NOME = os.getenv("EMPRESA_NOME", "Hazak")
# Limite anual de faturamento do MEI. # FISCAL: validar vigência/valor com contador.
LIMITE_MEI_ANUAL = float(os.getenv("LIMITE_MEI_ANUAL", "81000"))
