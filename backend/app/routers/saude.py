from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..config import LIMITE_MEI_ANUAL
from ..db import get_db
from ..models import Usuario, Venda
from ..schemas import SaudeOut
from ..security import get_current_user

router = APIRouter(prefix="/api/saude", tags=["saude"])

LIMIAR_GATILHO_TETO = 0.75  # # FISCAL: validar com contador


@router.get("", response_model=SaudeOut)
def saude(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    hoje = date.today()
    corte = hoje - timedelta(days=365)
    fat = float(
        db.query(func.coalesce(func.sum(Venda.total), 0))
        .filter(Venda.usuario_id == usuario.id, Venda.criado_em >= corte)
        .scalar() or 0
    )
    teto = LIMITE_MEI_ANUAL
    pct = (fat / teto) if teto else 0.0
    restante = round(teto - fat, 2)
    media = round(fat / 12, 2)
    meses = round(restante / media, 1) if media > 0 and restante > 0 else None
    projecao = (hoje + timedelta(days=int(meses * 30))) if meses else None
    return SaudeOut(
        faturamento_12m=round(fat, 2), teto_mei=teto, pct_teto=round(pct, 4),
        restante=restante, media_mensal=media, meses_ate_teto=meses,
        projecao_estouro=projecao, gatilho_teto=pct >= LIMIAR_GATILHO_TETO,
    )
