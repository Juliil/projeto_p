import { useEffect, useMemo, useState } from "react";
import { api, brl, abrirNotaPDF } from "../api";
import { IcTrash, IcReceipt, IcDownload, IcSearch, IcCheck, IcTruck } from "../components/Icons";
import EnderecoForm from "../components/EnderecoForm";

const ENDERECO_VAZIO = { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };
const formatarEndereco = (c) => {
  if (!c || !c.logradouro) return "";
  const l1 = [c.logradouro, c.numero].filter(Boolean).join(", ");
  const l2 = [c.bairro, c.cidade && `${c.cidade}${c.uf ? "/" + c.uf : ""}`].filter(Boolean).join(" - ");
  return [l1, c.complemento, l2].filter(Boolean).join(" - ");
};

const PAGAMENTOS = [["pix", "PIX"], ["dinheiro", "Dinheiro"], ["credito", "Crédito"], ["debito", "Débito"]];
const STATUS = {
  pre_venda: ["tag-gold", "Pré-venda"],
  concluida: ["tag-ok", "Concluída"],
  expirada: ["tag-reprovado", "Expirada"],
};
const horasRestantes = (iso) => Math.max(0, Math.ceil((new Date(iso) - new Date()) / 3.6e6));
const dataBR = (d) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");

export default function Vendas() {
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [clienteSel, setClienteSel] = useState(null);
  const [clienteBusca, setClienteBusca] = useState("");
  const [novo, setNovo] = useState(null);
  const [itemBusca, setItemBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState("pix");
  const [preVenda, setPreVenda] = useState(false);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);
  // entrega
  const [entAlvo, setEntAlvo] = useState(null);     // venda em foco
  const [entConfirm, setEntConfirm] = useState(false); // true = confirmando pré-venda
  const [entForm, setEntForm] = useState({ tipo: "retirada", data: "", endereco: "" });

  const carregar = async () => {
    try {
      const [p, c, v] = await Promise.all([api.produtos(), api.clientes(), api.vendas()]);
      setProdutos(p); setClientes(c); setVendas(v);
    } catch (e) { setErro(e.message); }
  };
  useEffect(() => { carregar(); }, []);

  const achados = useMemo(() => {
    const q = itemBusca.trim().toLowerCase();
    if (!q) return [];
    return produtos.filter((p) => p.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [itemBusca, produtos]);

  const addProduto = (p) => {
    if (Number(p.estoque) <= 0) return;
    setCarrinho((arr) => {
      const ex = arr.find((i) => i.produto_id === p.id);
      if (ex) {
        if (ex.quantidade >= Number(p.estoque)) return arr;
        return arr.map((i) => i.produto_id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...arr, { produto_id: p.id, nome: p.nome, preco: Number(p.preco_venda), estoque: Number(p.estoque), quantidade: 1 }];
    });
    setItemBusca("");
  };
  const setQtd = (id, q) => setCarrinho((arr) => arr.map((i) => {
    if (i.produto_id !== id) return i;
    return { ...i, quantidade: Math.max(1, Math.min(Number(q) || 1, i.estoque)) };
  }));
  const removeItem = (id) => setCarrinho((arr) => arr.filter((i) => i.produto_id !== id));
  const total = useMemo(() => carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0), [carrinho]);

  const clientesFiltrados = useMemo(() => {
    const q = clienteBusca.trim().toLowerCase();
    if (!q) return [];
    return clientes.filter((c) => !c.padrao && c.nome.toLowerCase().includes(q)).slice(0, 6);
  }, [clienteBusca, clientes]);

  const salvarNovoCliente = async () => {
    setErro("");
    try {
      const c = await api.criarCliente({ ...novo, nome: novo.nome.trim(), telefone: novo.telefone.trim() || null });
      setClientes((arr) => [...arr, c]);
      setClienteSel(c); setNovo(null); setClienteBusca("");
    } catch (e) { setErro(e.message); }
  };

  const registrar = async () => {
    setErro(""); setMsg(""); setSalvando(true);
    try {
      if (carrinho.length === 0) throw new Error("Adicione ao menos um produto");
      const venda = await api.criarVenda({
        cliente_id: clienteSel?.id || null, forma_pagamento: pagamento, pre_venda: preVenda,
        itens: carrinho.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
      });
      setMsg(preVenda ? `Pré-venda reservada (${brl(venda.total)}). Confirme em até 24h.` : `Venda registrada (${brl(venda.total)}).`);
      setCarrinho([]); setClienteSel(null); setClienteBusca(""); setPreVenda(false);
      await carregar();
    } catch (e) { setErro(e.message); } finally { setSalvando(false); }
  };

  const nota = async (v) => {
    setErro("");
    try { if (!v.nf_numero) await api.emitirNota(v.id); await abrirNotaPDF(v.id); await carregar(); }
    catch (e) { setErro(e.message); }
  };

  // ----- entrega -----
  const abrirEntrega = (v, confirm) => {
    setEntAlvo(v); setEntConfirm(confirm); setErro("");
    const cli = clientes.find((c) => c.id === v.cliente_id);
    const enderecoCliente = formatarEndereco(cli);
    setEntForm({
      tipo: v.entrega_tipo || "retirada",
      data: v.entrega_data || "",
      endereco: v.entrega_endereco || enderecoCliente || "",
    });
  };
  const salvarEntrega = async (status) => {
    setErro("");
    if (entForm.tipo === "entrega" && status === "agendada" && !entForm.data) { setErro("Informe a data da entrega"); return; }
    try {
      if (entConfirm) await api.confirmarVenda(entAlvo.id);
      await api.definirEntrega(entAlvo.id, { tipo: entForm.tipo, data: entForm.data || null, endereco: entForm.endereco || null, status });
      setMsg(entConfirm ? "Venda confirmada e entrega agendada." : "Entrega atualizada.");
      setEntAlvo(null); await carregar();
    } catch (e) { setErro(e.message); }
  };

  const resumoEntrega = (v) => {
    if (!v.entrega_tipo) return <span className="muted">—</span>;
    const label = v.entrega_tipo === "entrega" ? "Entrega" : "Retirada";
    const cls = v.entrega_status === "concluida" ? "tag-ok" : v.entrega_status === "agendada" ? "tag-gold" : "tag-reprovado";
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span className={`tag ${cls}`}>{label}{v.entrega_data ? ` · ${dataBR(v.entrega_data)}` : ""}</span>
        {v.entrega_status === "concluida" && <span className="muted" style={{ fontSize: 11 }}>✓ feito</span>}
      </span>
    );
  };

  return (
    <div className="content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 28 }}>Vendas</h2>
        <p className="muted" style={{ marginTop: 4 }}>Registre a venda ou pré-venda (reserva 24h). Cada venda tem entrega/retirada; confirmar a pré-venda agenda a entrega.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }} className="row2">
        <div className="panel">
          <div className="panel__head"><h3>Nova venda</h3></div>
          <div className="panel__body" style={{ display: "grid", gap: 16 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Cliente <span className="muted">(vazio = Consumidor)</span></label>
              {clienteSel ? (
                <span className="chip">{clienteSel.nome}{clienteSel.telefone ? ` · ${clienteSel.telefone}` : ""}
                  <button className="linklike" onClick={() => setClienteSel(null)} style={{ color: "var(--muted)" }}>trocar</button></span>
              ) : novo ? (
                <div style={{ display: "grid", gap: 10, border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
                  <div className="row2">
                    <input className="input" placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} autoFocus />
                    <input className="input" placeholder="Telefone (opcional)" value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} />
                  </div>
                  <EnderecoForm value={novo} onChange={(v) => setNovo({ ...novo, ...v })} />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setNovo(null)}>Cancelar</button>
                    <button className="btn btn-primary btn-sm" onClick={salvarNovoCliente} disabled={!novo.nome.trim()}>Salvar cliente</button>
                  </div>
                </div>
              ) : (
                <div className="combo">
                  <input className="input" placeholder="Buscar cliente pelo nome…" value={clienteBusca} onChange={(e) => setClienteBusca(e.target.value)} />
                  {clienteBusca.trim() && (
                    <div className="combo__list">
                      {clientesFiltrados.map((c) => (
                        <button key={c.id} className="combo__opt" onClick={() => { setClienteSel(c); setClienteBusca(""); }}>
                          <span>{c.nome}</span><span className="muted">{c.telefone || ""}</span></button>
                      ))}
                      <button className="combo__opt add" onClick={() => setNovo({ nome: clienteBusca.trim(), telefone: "", ...ENDERECO_VAZIO })}>+ Cadastrar “{clienteBusca.trim()}”</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label>Itens</label>
              <div className="combo">
                <input className="input" placeholder="Buscar produto…" value={itemBusca} onChange={(e) => setItemBusca(e.target.value)} style={{ paddingLeft: 36 }} />
                <IcSearch style={{ width: 16, position: "absolute", left: 12, top: 13, color: "var(--muted)" }} />
                {achados.length > 0 && (
                  <div className="combo__list">
                    {achados.map((p) => (
                      <button key={p.id} className="combo__opt" disabled={Number(p.estoque) <= 0} onClick={() => addProduto(p)}>
                        <span>{p.nome}</span><span className="muted">{Number(p.estoque)} em estoque · {brl(p.preco_venda)}</span></button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {carrinho.length === 0 && <span className="muted" style={{ fontSize: 13.5 }}>Nenhum item ainda — busque acima.</span>}
                {carrinho.map((i) => (
                  <div key={i.produto_id} style={{ display: "grid", gridTemplateColumns: "1fr 70px auto auto", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 14 }}>{i.nome} <span className="muted" style={{ fontSize: 12 }}>(máx {i.estoque})</span></span>
                    <input className="input" type="number" min="1" max={i.estoque} value={i.quantidade} onChange={(e) => setQtd(i.produto_id, e.target.value)} />
                    <span className="price" style={{ minWidth: 78, textAlign: "right" }}>{brl(i.preco * i.quantidade)}</span>
                    <button className="icon-btn" title="Remover" onClick={() => removeItem(i.produto_id)}><IcTrash /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="row2">
              <div className="field" style={{ margin: 0 }}><label>Pagamento</label>
                <select className="input" value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                  {PAGAMENTOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <label className="field" style={{ margin: 0, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "end", paddingBottom: 12 }}>
                <input type="checkbox" checked={preVenda} onChange={(e) => setPreVenda(e.target.checked)} />
                Registrar como pré-venda (reserva 24h)
              </label>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head"><h3>Resumo</h3></div>
          <div className="panel__body" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span className="price" style={{ fontFamily: "var(--display)", fontSize: 30, color: "var(--accent)" }}>{brl(total)}</span>
            </div>
            {msg && <div style={{ color: "#2f7a3a", fontSize: 13.5 }}>{msg}</div>}
            {erro && <div className="err">{erro}</div>}
            <button className="btn btn-primary btn-block" onClick={registrar} disabled={salvando}>
              {salvando ? "Registrando…" : preVenda ? "Reservar pré-venda" : "Registrar venda"}</button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <div className="panel__head"><h3>Vendas recentes</h3></div>
        {vendas.length === 0 ? (
          <div className="empty">Nenhuma venda ainda.</div>
        ) : (
          <table>
            <thead><tr><th>Cliente</th><th>Total</th><th>Status</th><th>Entrega</th><th>Ação</th></tr></thead>
            <tbody>
              {vendas.map((v) => {
                const [cls, label] = STATUS[v.status] || STATUS.concluida;
                return (
                  <tr key={v.id}>
                    <td><b>{v.cliente_nome || "Consumidor"}</b></td>
                    <td className="price">{brl(v.total)}</td>
                    <td>
                      <span className={`tag ${cls}`}>{label}</span>
                      {v.status === "pre_venda" && v.reserva_expira_em && (
                        <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>expira em ~{horasRestantes(v.reserva_expira_em)}h</span>
                      )}
                    </td>
                    <td>{resumoEntrega(v)}</td>
                    <td>
                      <div className="right-actions">
                        {v.status === "pre_venda" && (
                          <button className="btn btn-primary btn-sm" onClick={() => abrirEntrega(v, true)}><IcCheck style={{ width: 15 }} /> Confirmar</button>
                        )}
                        {v.status === "concluida" && (
                          <>
                            <button className="icon-btn" title="Entrega/Retirada" onClick={() => abrirEntrega(v, false)}><IcTruck /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => nota(v)}>
                              {v.nf_numero ? <><IcDownload style={{ width: 15 }} /> Ver NFC-e</> : <><IcReceipt style={{ width: 15 }} /> NFC-e</>}</button>
                          </>
                        )}
                        {v.status === "expirada" && <span className="muted">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de entrega */}
      {entAlvo && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setEntAlvo(null)}>
          <div className="modal">
            <h3>{entConfirm ? "Confirmar venda · agendar" : "Entrega / Retirada"}</h3>
            <p className="muted" style={{ margin: "-6px 0 16px" }}>
              {entConfirm ? "Defina a entrega para concluir a pré-venda." : "Como esta venda chega na cliente?"}
            </p>
            <div className="tabs" style={{ marginBottom: 16 }}>
              <button className={entForm.tipo === "retirada" ? "active" : ""} onClick={() => setEntForm({ ...entForm, tipo: "retirada" })}>Retirada na loja</button>
              <button className={entForm.tipo === "entrega" ? "active" : ""} onClick={() => setEntForm({ ...entForm, tipo: "entrega" })}>Entrega</button>
            </div>
            <div className="field">
              <label>{entForm.tipo === "entrega" ? "Data da entrega" : "Data prevista (opcional)"}</label>
              <input className="input" type="date" value={entForm.data || ""} onChange={(e) => setEntForm({ ...entForm, data: e.target.value })} />
            </div>
            {entForm.tipo === "entrega" && (
              <div className="field"><label>Endereço</label>
                <input className="input" value={entForm.endereco} onChange={(e) => setEntForm({ ...entForm, endereco: e.target.value })} placeholder="Rua, nº, bairro" /></div>
            )}
            {erro && <div className="err">{erro}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost btn-block" onClick={() => setEntAlvo(null)}>Cancelar</button>
              <button className="btn btn-ghost btn-block" onClick={() => salvarEntrega("concluida")}>Concluir agora</button>
              <button className="btn btn-primary btn-block" onClick={() => salvarEntrega("agendada")}>
                {entConfirm ? "Confirmar e agendar" : "Agendar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
