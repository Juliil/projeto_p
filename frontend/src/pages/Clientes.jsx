import { useEffect, useState } from "react";
import { api, brl } from "../api";
import { IcPlus, IcUsers, IcEdit } from "../components/Icons";
import EnderecoForm from "../components/EnderecoForm";

const VAZIO = { nome: "", telefone: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };

export default function Clientes() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try { setItens(await api.clientes()); } catch (e) { setErro(e.message); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);

  const abrirNovo = () => { setEditId(null); setForm(VAZIO); setErro(""); setAberto(true); };
  const abrirEdicao = async (c) => {
    // o resumo não traz todos os campos; busco o cliente completo da lista (tem cidade/bairro/uf) + demais via edição local
    setEditId(c.id);
    setForm({ nome: c.nome, telefone: c.telefone || "", cep: c.cep || "", logradouro: c.logradouro || "",
      numero: c.numero || "", complemento: c.complemento || "", bairro: c.bairro || "", cidade: c.cidade || "", uf: c.uf || "" });
    setErro(""); setAberto(true);
  };

  const salvar = async (e) => {
    e.preventDefault(); setSalvando(true); setErro("");
    try {
      if (editId) await api.atualizarCliente(editId, form);
      else await api.criarCliente(form);
      setAberto(false); await carregar();
    } catch (err) { setErro(err.message); } finally { setSalvando(false); }
  };

  const cadastrados = itens.filter((c) => !c.padrao);
  const recorrentes = cadastrados.filter((c) => c.total_compras > 1).length;

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 28 }}>Clientes</h2>
          <p className="muted" style={{ marginTop: 4 }}>Base do CRM — recompra, gasto e endereço (entregas por região).</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}><IcPlus style={{ width: 18 }} /> Novo cliente</button>
      </div>

      <div className="cards">
        <div className="stat"><div className="k">Clientes cadastrados</div><div className="v">{cadastrados.length}</div></div>
        <div className="stat"><div className="k">Recorrentes (2+ compras)</div><div className="v">{recorrentes}</div></div>
      </div>

      {erro && <div className="err" style={{ marginBottom: 14 }}>{erro}</div>}

      <div className="panel">
        <div className="panel__head"><h3>Base de clientes</h3></div>
        {carregando ? (
          <div className="empty">Carregando…</div>
        ) : (
          <table>
            <thead><tr><th>Cliente</th><th>Telefone</th><th>Cidade</th><th>Compras</th><th>Total gasto</th><th>Última</th><th></th></tr></thead>
            <tbody>
              {itens.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {c.padrao && <IcUsers style={{ width: 15, color: "var(--muted)" }} />}{c.nome}
                      {c.padrao && <span className="tag tag-gold">padrão</span>}
                    </b>
                  </td>
                  <td className="muted">{c.telefone || "—"}</td>
                  <td className="muted">{c.cidade ? `${c.cidade}${c.uf ? "/" + c.uf : ""}` : "—"}</td>
                  <td>{c.total_compras}</td>
                  <td className="price">{brl(c.total_gasto)}</td>
                  <td className="muted">{c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString("pt-BR") : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    {!c.padrao && <button className="icon-btn" title="Editar" onClick={() => abrirEdicao(c)}><IcEdit /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {aberto && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setAberto(false)}>
          <form className="modal" onSubmit={salvar} style={{ maxWidth: 520 }}>
            <h3>{editId ? "Editar cliente" : "Novo cliente"}</h3>
            {erro && <div className="err">{erro}</div>}
            <div className="row2">
              <div className="field"><label>Nome</label>
                <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex.: Bruna Silva" autoFocus /></div>
              <div className="field"><label>Telefone <span className="muted">(opcional)</span></label>
                <input className="input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(92) 9 9999-0000" /></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", margin: "4px 0 8px" }}>Endereço</div>
            <EnderecoForm value={form} onChange={(v) => setForm({ ...form, ...v })} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setAberto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary btn-block" disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
