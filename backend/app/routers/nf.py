"""NFC-e SIMULADA (PoC) — Nota Fiscal de Consumidor (modelo 65).

Gera uma "notinha" em PDF para validação visual. Não tem valor fiscal.

Contexto fiscal: o MEI vendendo a CONSUMIDOR FINAL (pessoa física) é, em regra,
DISPENSADO de emitir nota — o comprovante comum é um recibo. A NFC-e aqui é
OPCIONAL (a cliente que pede). A obrigação surge ao vender para PJ (CNPJ).
A função emitir_nota() isola a emissão: hoje gera o PDF local; amanhã chama o
provedor real de NFC-e (Focus NFe, NFe.io, etc.).
# FISCAL: validar dispensa/obrigação e modelo com contador/SEFAZ-AM antes de produção.
"""
from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from ..config import EMPRESA_NOME
from ..db import get_db
from ..models import Usuario, Venda
from ..security import get_current_user

router = APIRouter(prefix="/api/nf", tags=["nf"])

PAG_LABEL = {"pix": "PIX", "dinheiro": "Dinheiro", "credito": "Cartão de crédito", "debito": "Cartão de débito"}


def _numero_nf(venda: Venda) -> str:
    ano = venda.criado_em.year if venda.criado_em else datetime.now().year
    return f"{ano}-{venda.id:06d}"


# Bobina térmica 80mm (Elgin i8 e similares). Altura dinâmica conforme itens.
LARGURA_BOBINA = 80 * mm
MARGEM = 4 * mm


def _gerar_pdf(venda: Venda, loja_nome: str) -> bytes:
    itens = venda.itens or []
    w = LARGURA_BOBINA
    h = (78 + len(itens) * 9) * mm  # altura proporcional ao nº de itens + folga p/ guilhotina
    esq, dir_ = MARGEM, w - MARGEM

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(w, h))

    # marca d'água Hazak — pequena e clara, atrás do conteúdo (branding na via do cliente)
    c.saveState()
    c.setFont("Helvetica-Bold", 22)
    c.setFillGray(0.90)
    c.translate(w / 2, h / 2)
    c.rotate(30)
    c.drawCentredString(0, 0, "HAZAK")
    c.restoreState()

    y = h - 6 * mm

    def centro(txt, fonte, tam, dy, gray=0.1):
        nonlocal y
        c.setFont(fonte, tam); c.setFillGray(gray)
        c.drawCentredString(w / 2, y, txt); y -= dy

    def esquerda(txt, fonte, tam, dy, gray=0.1):
        nonlocal y
        c.setFont(fonte, tam); c.setFillGray(gray)
        c.drawString(esq, y, txt); y -= dy

    def tracejado():
        nonlocal y
        c.setStrokeGray(0.55); c.setDash(1, 2)
        c.line(esq, y, dir_, y)
        c.setDash(); y -= 3.2 * mm

    centro(loja_nome.upper(), "Helvetica-Bold", 12, 5 * mm)
    centro("Bolsas e acessórios · Manaus/AM", "Helvetica", 7, 4 * mm, 0.35)
    centro("CUPOM NFC-e", "Helvetica-Bold", 8, 4.6 * mm)
    tracejado()

    esquerda(f"Nota: {venda.nf_numero or _numero_nf(venda)}", "Helvetica", 7.5, 4 * mm)
    esquerda(f"Emissao: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}", "Helvetica", 7.5, 4 * mm)
    esquerda(f"Cliente: {venda.cliente_nome or 'Consumidor'}", "Helvetica", 7.5, 4 * mm)
    esquerda(f"Pagamento: {PAG_LABEL.get(venda.forma_pagamento, venda.forma_pagamento)}", "Helvetica", 7.5, 4 * mm)
    tracejado()

    c.setFont("Helvetica-Bold", 7); c.setFillGray(0.1)
    c.drawString(esq, y, "ITEM"); c.drawRightString(dir_, y, "VALOR"); y -= 4.4 * mm
    for it in itens:
        nome = (it.get("nome") or "")[:36]
        esquerda(nome, "Helvetica", 8, 3.8 * mm)
        q = it.get("quantidade", 0)
        pu = float(it.get("preco_unit", 0))
        sub = float(it.get("subtotal", 0))
        c.setFont("Helvetica", 7.5); c.setFillGray(0.35)
        c.drawString(esq, y, f"{q:g} x R$ {pu:.2f}")
        c.setFillGray(0.1)
        c.drawRightString(dir_, y, f"R$ {sub:.2f}"); y -= 4.8 * mm

    tracejado()
    c.setFont("Helvetica-Bold", 13); c.setFillGray(0)
    c.drawString(esq, y, "TOTAL")
    c.drawRightString(dir_, y, f"R$ {float(venda.total):.2f}"); y -= 9 * mm

    c.setFont("Helvetica", 7.5); c.setFillGray(0.3)
    centro("Obrigada pela preferencia!", "Helvetica", 7.5, 4 * mm, 0.3)
    centro("@hazakmao", "Helvetica", 7.5, 4 * mm, 0.3)

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


def _get_venda(venda_id: int, db: Session, usuario: Usuario) -> Venda:
    venda = db.get(Venda, venda_id)
    if not venda or venda.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda


@router.post("/vendas/{venda_id}/emitir")
def emitir_nota(venda_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    """Emite a NFC-e simulada (atribui número e data). Trocar pelo provedor real depois."""
    venda = _get_venda(venda_id, db, usuario)
    if venda.status != "concluida":
        raise HTTPException(status_code=400, detail="Confirme a venda antes de emitir a NFC-e")
    if not venda.nf_numero:
        venda.nf_numero = _numero_nf(venda)
        venda.nf_emitida_em = datetime.now(timezone.utc)
        db.commit()
        db.refresh(venda)
    return {"nf_numero": venda.nf_numero, "nf_emitida_em": venda.nf_emitida_em}


@router.get("/vendas/{venda_id}/pdf")
def baixar_pdf(venda_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    venda = _get_venda(venda_id, db, usuario)
    loja = (usuario.perfil or {}).get("nome_loja") or EMPRESA_NOME
    pdf = _gerar_pdf(venda, loja)
    nome = f"nota-{venda.nf_numero or venda.id}.pdf"
    return StreamingResponse(
        BytesIO(pdf), media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{nome}"'},
    )
