import { useEffect, useState } from "react";
import { api, brl } from "../api";
import { IcPlus, IcTrash, IcEdit, IcAlert, IcBag } from "../components/Icons";

const CATEGORIAS = ["Bolsa", "Clutch", "Mochila", "Necessaire", "Acessório"];
const VAZIO = { nome: "", categoria: "Bolsa", descricao: "", foto_url: "", preco_venda: "", custo: "", estoque: "", estoque_minimo: "", ativo: true };
const emFalta = (p) => Number(p.estoque_minimo) > 0 && Number(p.estoque) <= Number(p.estoque_minimo);

export default function Produtos() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try { setItens(await api.produtos()); } catch (e) { setErro(e.message); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => { setEditando(null); setForm(VAZIO); setErro(""); setAberto(true); };
  const abrirEdicao = (p) => {
    setEditando(p);
    setForm({ nome: p.nome, categoria: p.categoria || "Bolsa", descricao: p.descricao || "", foto_url: p.foto_url || "",
      preco_venda: p.preco_venda, custo: p.custo, estoque: p.estoque, estoque_minimo: p.estoque_minimo, ativo: p.ativo });
    setErro(""); setAberto(true);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = async (e) => {
    e.preventDefault(); setSalvando(true); setErro("");
    const payload = {
      nome: form.nome.trim(), categoria: form.categoria, descricao: form.descricao, foto_url: form.foto_url.trim() || null,
      preco_venda: Number(form.preco_venda) || 0, custo: Number(form.custo) || 0,
      estoque: Number(form.estoque) || 0, estoque_minimo: Number(form.estoque_minimo) || 0, ativo: !!form.ativo,
    };
    try {
      if (editando) await api.atualizarProduto(editando.id, payload);
      else await api.criarProduto(payload);
      setAberto(false); await carregar();
    } catch (err) { setErro(err.message); } finally { setSalvando(false); }
  };

  const remover = async (p) => {
    if (!window.confirm(`Excluir "${p.nome}"?`)) return;
    try { await api.removerProduto(p.id); await carregar(); } catch (err) { setErro(err.message); }
  };

  const totalFalta = itens.filter(emFalta).length;
  const valorEstoque = itens.reduce((s, p) => s + Number(p.preco_venda) * Number(p.estoque), 0);

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 28 }}>Produtos</h2>
          <p className="muted" style={{ marginTop: 4 }}>Seu catálogo de bolsas e acessórios — estoque e vitrine.</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}><IcPlus style={{ width: 18 }} /> Novo produto</button>
      </div>

      <div className="cards">
        <div className="stat"><div className="k">Produtos</div><div className="v">{itens.length}</div></div>
        <div className="stat"><div className="k">Valor em estoque (venda)</div><div className="v" style={{ fontSize: 26 }}>{brl(valorEstoque)}</div></div>
        <div className="stat" style={totalFalta ? { borderColor: "var(--wine)" } : null}>
          <div className="k">Precisam de reposição</div>
          <div className="v" style={{ color: totalFalta ? "var(--accent)" : "inherit", display: "flex", alignItems: "center", gap: 8 }}>
            {totalFalta > 0 && <IcAlert style={{ width: 22 }} />}{totalFalta}
          </div>
        </div>
      </div>

      {erro && <div className="err" style={{ marginBottom: 14 }}>{erro}</div>}

      {carregando ? (
        <div className="panel"><div className="empty">Carregando…</div></div>
      ) : itens.length === 0 ? (
        <div className="panel"><div className="empty">Nenhum produto ainda.<br />
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={abrirNovo}><IcPlus style={{ width: 18 }} /> Cadastrar o primeiro</button>
        </div></div>
      ) : (
        <div className="shelf">
          {itens.map((p) => (
            <div key={p.id} className="bag-card">
              <div className="thumb" style={p.foto_url ? { backgroundImage: `url(${p.foto_url})` } : null}>
                {!p.foto_url && <IcBag style={{ width: 48 }} />}
              </div>
              <div className="body">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                  <h4>{p.nome}</h4>
                  {!p.ativo && <span className="tag tag-gold">oculto</span>}
                  {emFalta(p) && <span className="tag tag-alerta">repor</span>}
                </div>
                <span className="cat">{p.categoria} · {Number(p.estoque)} em estoque</span>
                <span className="pr">{brl(p.preco_venda)}</span>
                <div className="right-actions" style={{ marginTop: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicao(p)}><IcEdit style={{ width: 15 }} /> Editar</button>
                  <button className="icon-btn" title="Excluir" onClick={() => remover(p)}><IcTrash /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aberto && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setAberto(false)}>
          <form className="modal" onSubmit={salvar}>
            <h3>{editando ? "Editar produto" : "Novo produto"}</h3>
            {erro && <div className="err">{erro}</div>}
            <div className="field"><label>Nome</label>
              <input className="input" value={form.nome} onChange={set("nome")} required placeholder="Ex.: Bolsa Coach Tabby" autoFocus /></div>
            <div className="row2">
              <div className="field"><label>Categoria</label>
                <select className="input" value={form.categoria} onChange={set("categoria")}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="field"><label>Foto (URL)</label>
                <input className="input" value={form.foto_url} onChange={set("foto_url")} placeholder="https://…" /></div>
            </div>
            <div className="row2">
              <div className="field"><label>Preço de venda (R$)</label>
                <input className="input" type="number" step="0.01" min="0" value={form.preco_venda} onChange={set("preco_venda")} placeholder="0,00" /></div>
              <div className="field"><label>Custo (R$)</label>
                <input className="input" type="number" step="0.01" min="0" value={form.custo} onChange={set("custo")} placeholder="0,00" /></div>
            </div>
            <div className="row2">
              <div className="field"><label>Estoque</label>
                <input className="input" type="number" step="1" min="0" value={form.estoque} onChange={set("estoque")} placeholder="0" /></div>
              <div className="field"><label>Estoque mínimo</label>
                <input className="input" type="number" step="1" min="0" value={form.estoque_minimo} onChange={set("estoque_minimo")} placeholder="0" /></div>
            </div>
            <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
              Mostrar na vitrine pública
            </label>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setAberto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-block" disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
