from sqlalchemy import (
    BigInteger, Boolean, Column, Date, ForeignKey, Numeric, Text, TIMESTAMP, func,
)
from sqlalchemy.dialects.postgresql import JSONB

from .db import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(BigInteger, primary_key=True)
    email = Column(Text, nullable=False, unique=True)
    senha_hash = Column(Text, nullable=False)
    nome = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="ativo")
    perfil = Column(JSONB, nullable=False, default=dict)  # ex.: {nome_loja, cidade, regime}
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Produto(Base):
    __tablename__ = "produtos"
    id = Column(BigInteger, primary_key=True)
    usuario_id = Column(BigInteger, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nome = Column(Text, nullable=False)
    categoria = Column(Text)                 # Bolsa | Clutch | Mochila | Acessório
    descricao = Column(Text)
    foto_url = Column(Text)                  # URL da foto (vitrine)
    preco_venda = Column(Numeric(12, 2), nullable=False, default=0)
    custo = Column(Numeric(12, 2), nullable=False, default=0)
    estoque = Column(Numeric(12, 2), nullable=False, default=0)
    estoque_minimo = Column(Numeric(12, 2), nullable=False, default=0)
    ativo = Column(Boolean, nullable=False, default=True)  # aparece na vitrine
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Venda(Base):
    __tablename__ = "vendas"
    id = Column(BigInteger, primary_key=True)
    usuario_id = Column(BigInteger, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(BigInteger, ForeignKey("clientes.id", ondelete="SET NULL"), nullable=True)
    cliente_nome = Column(Text)  # snapshot do nome no momento da venda
    forma_pagamento = Column(Text, nullable=False, default="pix")  # pix | dinheiro | credito | debito
    total = Column(Numeric(12, 2), nullable=False, default=0)
    itens = Column(JSONB, nullable=False, default=list)  # [{produto_id, nome, quantidade, preco_unit, subtotal}]
    status = Column(Text, nullable=False, default="concluida")  # pre_venda | concluida | expirada
    reserva_expira_em = Column(TIMESTAMP(timezone=True), nullable=True)  # pré-venda: 24h
    # entrega / retirada
    entrega_tipo = Column(Text, nullable=True)                        # retirada | entrega
    entrega_status = Column(Text, nullable=False, default="pendente")  # pendente | agendada | concluida
    entrega_data = Column(Date, nullable=True)                        # dia agendado (entra na agenda)
    entrega_endereco = Column(Text, nullable=True)
    nf_numero = Column(Text, nullable=True)              # nº da NFC-e simulada (quando emitida)
    nf_emitida_em = Column(TIMESTAMP(timezone=True), nullable=True)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Cliente(Base):
    """Cliente da loja — base do CRM/analytics. ID padrão (padrao=True) é o
    'Consumidor' usado quando a venda não identifica ninguém."""
    __tablename__ = "clientes"
    id = Column(BigInteger, primary_key=True)
    usuario_id = Column(BigInteger, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nome = Column(Text, nullable=False)
    telefone = Column(Text, nullable=True)   # opcional
    padrao = Column(Boolean, nullable=False, default=False)  # True = Consumidor (anônimo)
    # endereço estruturado (ViaCEP) — base para analytics geográfica
    cep = Column(Text, nullable=True)
    logradouro = Column(Text, nullable=True)
    numero = Column(Text, nullable=True)
    complemento = Column(Text, nullable=True)
    bairro = Column(Text, nullable=True)
    cidade = Column(Text, nullable=True)
    uf = Column(Text, nullable=True)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())


class EstoqueMovimento(Base):
    """Razão (ledger) imutável de movimentações de estoque — série temporal p/ analytics.
    quantidade assinada: + entrada, - saída."""
    __tablename__ = "estoque_movimentos"
    id = Column(BigInteger, primary_key=True)
    usuario_id = Column(BigInteger, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    produto_id = Column(BigInteger, ForeignKey("produtos.id", ondelete="SET NULL"), nullable=True)
    produto_nome = Column(Text, nullable=False)
    tipo = Column(Text, nullable=False)          # entrada | saida | ajuste
    quantidade = Column(Numeric(12, 2), nullable=False)
    saldo_apos = Column(Numeric(12, 2), nullable=False)
    origem = Column(Text, nullable=False)        # cadastro | edicao_produto | venda
    venda_id = Column(BigInteger, ForeignKey("vendas.id", ondelete="SET NULL"), nullable=True)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())
