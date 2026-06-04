import { useEffect, useMemo, useState } from "react";
import { api, brl } from "../api";
import { useAuth } from "../context/AuthContext";
import { IcBag, IcCart, IcAlert } from "../components/Icons";

const emFalta = (p) => Number(p.estoque_minimo) > 0 && Number(p.estoque) <= Number(p.estoque_minimo);

export default function Inicio({ onNav }) {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [saude, setSaude] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, v, s] = await Promise.all([
        api.produtos().catch(() => []), api.vendas().catch(() => []), api.saude().catch(() => null),
      ]);
      setProdutos(p); setVendas(v); setSaude(s);
    })();
  }, []);

  const aRepor = useMemo(() => produtos.filter(emFalta), [produtos]);
  const valorEstoque = useMemo(() => produtos.reduce((s, p) => s + Number(p.preco_venda) * Number(p.estoque), 0), [produtos]);
  const ticket = vendas.length ? vendas.reduce((s, v) => s + Number(v.total), 0) / vendas.length : 0;
  const loja = user?.perfil?.nome_loja || "sua loja";

  return (
    <div className="content">
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 30 }}>Olá, {user?.nome?.split(" ")[0]} 👜</h2>
        <p className="muted" style={{ marginTop: 4 }}>Aqui está a saúde de {loja} — estoque, vendas e o teto do MEI.</p>
      </div>

      {saude && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel__head"><h3>Faturamento (12 meses)</h3>
            <span className={`tag ${saude.gatilho_teto ? "tag-alerta" : "tag-ok"}`}>{(saude.pct_teto * 100).toFixed(0)}% do teto MEI</span></div>
          <div className="panel__body">
            <span className="price" style={{ fontFamily: "var(--display)", fontSize: 36 }}>{brl(saude.faturamento_12m)}</span>
            <div style={{ height: 8, background: "var(--cream)", borderRadius: 99, overflow: "hidden", marginTop: 12 }}>
              <div style={{ width: `${Math.min(saude.pct_teto * 100, 100)}%`, height: "100%", background: saude.gatilho_teto ? "var(--wine)" : "#2f7a3a" }} />
            </div>
          </div>
        </div>
      )}

      <div className="cards">
        <button className="stat" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => onNav("vendas")}>
          <div className="k">Vendas registradas</div><div className="v">{vendas.length}</div></button>
        <div className="stat"><div className="k">Ticket médio</div><div className="v" style={{ fontSize: 26 }}>{brl(ticket)}</div></div>
        <button className="stat" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => onNav("produtos")}>
          <div className="k">Valor em estoque</div><div className="v" style={{ fontSize: 26 }}>{brl(valorEstoque)}</div></button>
      </div>

      {aRepor.length > 0 && (
        <div className="panel" style={{ marginBottom: 24, borderColor: "var(--wine)" }}>
          <div className="panel__head" style={{ borderBottomColor: "#f0d9da" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--wine-deep)" }}>
              <IcAlert style={{ width: 18 }} /> {aRepor.length} produto(s) para repor</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav("produtos")}>Ver produtos</button>
          </div>
          <div className="panel__body" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {aRepor.map((p) => <span key={p.id} className="tag tag-alerta">{p.nome} — {Number(p.estoque)} un</span>)}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel__head"><h3>Comece por aqui</h3></div>
        <div className="panel__body" style={{ display: "grid", gap: 12 }}>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: "flex-start", gap: 10 }} onClick={() => onNav("produtos")}>
            <IcBag style={{ width: 18 }} /> Cadastrar bolsas e estoque</button>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: "flex-start", gap: 10 }} onClick={() => onNav("vendas")}>
            <IcCart style={{ width: 18 }} /> Registrar uma venda e emitir a nota</button>
        </div>
      </div>
    </div>
  );
}
