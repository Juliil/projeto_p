import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import BagSketch from "../components/BagSketch";

export default function Login() {
  const { login, preRegistro, empresa } = useAuth();
  const [tab, setTab] = useState("login"); // login | primeiro
  const [form, setForm] = useState({ nome: "", nome_loja: "", cidade: "Manaus", email: "", senha: "" });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      if (tab === "login") {
        await login(form.email, form.senha);
      } else {
        if (!form.nome.trim()) throw new Error("Informe seu nome");
        await preRegistro({ nome: form.nome, nome_loja: form.nome_loja, cidade: form.cidade, email: form.email, senha: form.senha });
      }
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  const onKey = (e) => e.key === "Enter" && submit();

  return (
    <div className="login">
      <div className="login__left">
        <div className="brand-mark"><span className="dot" /> {empresa.toUpperCase()}</div>

        <div className="login__benchmark">
          <div className="bench-tag">Bolsas & Acessórios · Manaus</div>
          <h1 className="bench-title">Hazak</h1>
          <div className="login__phrase">
            <p>
              Cada bolsa conta uma <span>história</span>. <br />
              O seu estoque, as suas <span>vendas</span> <br />
              e o seu negócio, no <span>controle</span>.
            </p>
            <span className="author">— gestão para a sua loja</span>
          </div>
        </div>

        <div className="bag-wrap"><BagSketch /></div>
      </div>

      <div className="login__right">
        <div className="login__card">
          <h2>{tab === "login" ? "Bem-vinda de volta" : "Vamos começar"}</h2>
          <p className="sub">{tab === "login" ? "Entre para gerir sua loja." : "Crie o acesso da sua loja."}</p>

          <div className="tabs">
            <button className={tab === "primeiro" ? "active" : ""} onClick={() => { setTab("primeiro"); setErr(null); }}>Primeiro acesso</button>
            <button className={tab === "login" ? "active" : ""} onClick={() => { setTab("login"); setErr(null); }}>Login</button>
          </div>

          {err && <div className="err">{err}</div>}

          {tab === "primeiro" && (
            <>
              <div className="field">
                <label>Seu nome</label>
                <input className="input" value={form.nome} onChange={set("nome")} onKeyDown={onKey} placeholder="Como podemos te chamar?" />
              </div>
              <div className="row2">
                <div className="field">
                  <label>Nome da loja</label>
                  <input className="input" value={form.nome_loja} onChange={set("nome_loja")} onKeyDown={onKey} placeholder="Ex.: Hazak" />
                </div>
                <div className="field">
                  <label>Cidade</label>
                  <input className="input" value={form.cidade} onChange={set("cidade")} onKeyDown={onKey} placeholder="Manaus" />
                </div>
              </div>
            </>
          )}
          <div className="field">
            <label>E-mail</label>
            <input className="input" type="email" value={form.email} onChange={set("email")} onKeyDown={onKey} placeholder="voce@hazak.com" />
          </div>
          <div className="field">
            <label>Senha</label>
            <input className="input" type="password" value={form.senha} onChange={set("senha")} onKeyDown={onKey} placeholder="••••••••" />
          </div>

          <button className="btn btn-primary btn-block" onClick={submit} disabled={busy} style={{ marginTop: 6 }}>
            {busy ? "…" : tab === "login" ? "Entrar" : "Criar acesso"}
          </button>
        </div>
      </div>
    </div>
  );
}
