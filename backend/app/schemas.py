from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------- Auth ----------
class PreRegistro(BaseModel):
    email: EmailStr
    senha: str
    nome: str
    nome_loja: Optional[str] = None
    cidade: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    senha: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    status: str


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    nome: str
    status: str
    perfil: dict[str, Any]


# ---------- Produtos ----------
class ProdutoIn(BaseModel):
    nome: str
    categoria: Optional[str] = "Bolsa"
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    preco_venda: float = 0
    custo: float = 0
    estoque: float = 0
    estoque_minimo: float = 0
    ativo: bool = True


class ProdutoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    categoria: Optional[str]
    descricao: Optional[str]
    foto_url: Optional[str]
    preco_venda: float
    custo: float
    estoque: float
    estoque_minimo: float
    ativo: bool


# ---------- Clientes (CRM) ----------
class EnderecoMixin(BaseModel):
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None


class ClienteIn(EnderecoMixin):
    nome: str
    telefone: Optional[str] = None


class ClienteOut(EnderecoMixin):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    telefone: Optional[str]
    padrao: bool


class ClienteResumoOut(EnderecoMixin):
    id: int
    nome: str
    telefone: Optional[str]
    padrao: bool
    total_compras: int
    total_gasto: float
    ultima_compra: Optional[datetime]


# ---------- Vendas ----------
class ItemVendaIn(BaseModel):
    produto_id: int
    quantidade: float = 1


class VendaIn(BaseModel):
    cliente_id: Optional[int] = None   # vazio = Consumidor (cliente padrão da loja)
    forma_pagamento: str = "pix"
    itens: list[ItemVendaIn] = []
    pre_venda: bool = False            # True = reserva estoque por 24h, confirma depois


class EntregaIn(BaseModel):
    tipo: str                          # retirada | entrega
    data: Optional[date] = None        # dia agendado (obrigatório p/ entrega agendada)
    endereco: Optional[str] = None
    status: str = "agendada"           # agendada | concluida | pendente


class VendaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cliente_id: Optional[int]
    cliente_nome: Optional[str]
    forma_pagamento: str
    total: float
    itens: list[dict[str, Any]]
    status: str
    reserva_expira_em: Optional[datetime]
    entrega_tipo: Optional[str]
    entrega_status: str
    entrega_data: Optional[date]
    entrega_endereco: Optional[str]
    nf_numero: Optional[str]
    nf_emitida_em: Optional[datetime]
    criado_em: datetime


# ---------- Saúde MEI ----------
class SaudeOut(BaseModel):
    faturamento_12m: float
    teto_mei: float
    pct_teto: float
    restante: float
    media_mensal: float
    meses_ate_teto: Optional[float]
    projecao_estouro: Optional[date]
    gatilho_teto: bool
