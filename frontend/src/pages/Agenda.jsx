import { useEffect, useMemo, useState } from "react";
import { api, brl } from "../api";
import { IcChevron, IcCheck } from "../components/Icons";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hojeIso = iso(new Date());

export default function Agenda() {
  const [vendas, setVendas] = useState([]);
  const [ref, setRef] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [diaSel, setDiaSel] = useState(null);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try { setVendas(await api.vendas()); } catch (e) { setErro(e.message); }
  };
  useEffect(() => { carregar(); }, []);

  // entregas/retiradas com data agendada
  const porDia = useMemo(() => {
    const m = {};
    for (const v of vendas) {
      if (!v.entrega_data) continue;
      (m[v.entrega_data] = m[v.entrega_data] || []).push(v);
    }
    return m;
  }, [vendas]);

  const celulas = useMemo(() => {
    const ano = ref.getFullYear(), mes = ref.getMonth();
    const base = new Date(ano, mes, 1 - new Date(ano, mes, 1).getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      return { d, iso: iso(d), doMes: d.getMonth() === mes };
    });
  }, [ref]);

  const navMes = (delta) => setRef(new Date(ref.getFullYear(), ref.getMonth() + delta, 1));
  const irHoje = () => { const d = new Date(); setRef(new Date(d.getFullYear(), d.getMonth(), 1)); };
  const mesAtual = `${MESES[ref.getMonth()]} ${ref.getFullYear()}`;
  const eventosDoDia = diaSel ? (porDia[diaSel] || []) : [];

  const concluir = async (v) => {
    setErro("");
    try {
      await api.definirEntrega(v.id, { tipo: v.entrega_tipo, data: v.entrega_data, endereco: v.entrega_endereco, status: "concluida" });
      await carregar();
    } catch (e) { setErro(e.message); }
  };

  return (
    <div className="content" style={{ maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 28 }}>Agenda de entregas</h2>
          <p className="muted" style={{ marginTop: 4 }}>Entregas e retiradas agendadas. Clique num dia para ver e dar baixa.</p>
        </div>
        <div className="cal-nav">
          <button className="icon-btn" onClick={() => navMes(-1)} title="Mês anterior"><IcChevron /></button>
          <span className="cal-title">{mesAtual}</span>
          <button className="icon-btn" onClick={() => navMes(1)} title="Próximo mês"><IcChevron style={{ transform: "rotate(180deg)" }} /></button>
          <button className="btn btn-ghost btn-sm" onClick={irHoje}>Hoje</button>
        </div>
      </div>

      {erro && <div className="err" style={{ marginBottom: 14 }}>{erro}</div>}

      <div className="cal">
        <div className="cal-head">{DIAS.map((d) => <div key={d} className="cal-dow">{d}</div>)}</div>
        <div className="cal-grid">
          {celulas.map((c) => {
            const evs = porDia[c.iso] || [];
            return (
              <button key={c.iso} className={`cal-cell ${c.doMes ? "" : "fora"} ${c.iso === hojeIso ? "hoje" : ""}`} onClick={() => setDiaSel(c.iso)}>
                <span className="cal-num">{c.d.getDate()}</span>
                <span className="cal-evs">
                  {evs.slice(0, 3).map((v) => (
                    <span key={v.id} className={`cal-ev tag ${v.entrega_status === "concluida" ? "tag-ok" : v.entrega_tipo === "entrega" ? "tag-gold" : "tag-alerta"}`}
                      title={`${v.cliente_nome || "Consumidor"} · ${v.entrega_tipo}`}>
                      {v.entrega_tipo === "entrega" ? "🚚" : "🛍️"} {v.cliente_nome || "Consumidor"}
                    </span>
                  ))}
                  {evs.length > 3 && <span className="muted" style={{ fontSize: 11 }}>+{evs.length - 3}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {diaSel && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setDiaSel(null)}>
          <div className="modal">
            <h3>{new Date(diaSel + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</h3>
            {eventosDoDia.length === 0 ? (
              <p className="muted" style={{ margin: "4px 0 16px" }}>Nada agendado neste dia.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, margin: "6px 0 16px" }}>
                {eventosDoDia.map((v) => (
                  <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>
                    <div>
                      <b>{v.cliente_nome || "Consumidor"}</b>{" "}
                      <span className={`tag ${v.entrega_tipo === "entrega" ? "tag-gold" : "tag-alerta"}`}>{v.entrega_tipo === "entrega" ? "Entrega" : "Retirada"}</span>
                      <div className="muted" style={{ fontSize: 13 }}>{brl(v.total)}{v.entrega_endereco ? ` · ${v.entrega_endereco}` : ""}</div>
                    </div>
                    {v.entrega_status === "concluida"
                      ? <span className="tag tag-ok">✓ feito</span>
                      : <button className="btn btn-primary btn-sm" onClick={() => concluir(v)}><IcCheck style={{ width: 15 }} /> Concluir</button>}
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-ghost btn-block" onClick={() => setDiaSel(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
