import { useEffect, useState } from "react";
import { api, brl } from "../api";
import { IcAlert } from "../components/Icons";

export default function Saude() {
  const [s, setS] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => { api.saude().then(setS).catch((e) => setErro(e.message)); }, []);

  if (erro) return <div className="content"><div className="err">{erro}</div></div>;
  if (!s) return <div className="content"><div className="empty">Carregando…</div></div>;

  const pct = Math.min(s.pct_teto * 100, 100);
  const cor = pct >= 85 ? "var(--wine)" : pct >= 60 ? "#9a6700" : "#2f7a3a";

  return (
    <div className="content">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 28 }}>Saúde MEI</h2>
        <p className="muted" style={{ marginTop: 4 }}>Seu faturamento dos últimos 12 meses frente ao teto do MEI.</p>
      </div>

      <div className="panel" style={{ marginBottom: 20, borderColor: s.gatilho_teto ? "var(--wine)" : "var(--line)" }}>
        <div className="panel__head">
          <h3>Faturamento dos últimos 12 meses</h3>
          <span className={`tag ${s.gatilho_teto ? "tag-alerta" : "tag-ok"}`}>{pct.toFixed(0)}% do teto</span>
        </div>
        <div className="panel__body">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span className="price" style={{ fontFamily: "var(--display)", fontSize: 40 }}>{brl(s.faturamento_12m)}</span>
            <span className="muted">de {brl(s.teto_mei)} (teto do MEI)</span>
          </div>
          <div style={{ height: 10, background: "var(--cream)", borderRadius: 99, overflow: "hidden", marginTop: 14 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: cor, transition: "width .3s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }} className="muted">
            <span>~{brl(s.media_mensal)}/mês</span><span>Faltam {brl(s.restante)}</span>
          </div>
          <p style={{ marginTop: 14, fontSize: 14.5 }}>
            {s.meses_ate_teto != null
              ? <>No ritmo atual, você atinge o teto em <b>~{s.meses_ate_teto} meses</b>{s.projecao_estouro ? <> (≈ {new Date(s.projecao_estouro + "T00:00:00").toLocaleDateString("pt-BR")})</> : null}.</>
              : <>Sem faturamento suficiente para projetar o teto ainda.</>}
            {" "}<span className="muted" style={{ fontSize: 12 }}># validar com contador</span>
          </p>
        </div>
      </div>

      {s.gatilho_teto && (
        <div className="panel">
          <div className="panel__body" style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--wine-deep)" }}>
            <IcAlert style={{ width: 20, flexShrink: 0, marginTop: 2 }} />
            <div>
              <b>Você passou de 75% do teto do MEI.</b>
              <div className="muted" style={{ fontSize: 13.5 }}>Vale avaliar a virada para ME com um contador antes de estourar o limite.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
