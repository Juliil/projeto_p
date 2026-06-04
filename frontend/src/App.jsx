import { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { IcSun, IcMoon } from "./components/Icons";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import Clientes from "./pages/Clientes";
import Agenda from "./pages/Agenda";
import Saude from "./pages/Saude";
import Vitrine from "./pages/Vitrine";
import Sidebar from "./components/Sidebar";
import Loading from "./components/Loading";

const TITULOS = { inicio: "Início", produtos: "Produtos", vendas: "Vendas", clientes: "Clientes", agenda: "Agenda", saude: "Saúde MEI" };

function Shell() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const escuro = theme === "dark";
  const [active, setActive] = useState("inicio");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("hz_sidebar_collapsed") === "1");
  const inicial = (user?.nome || "?").trim().charAt(0).toUpperCase();

  const toggleSidebar = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("hz_sidebar_collapsed", next ? "1" : "0");
      return next;
    });

  const render = () => {
    switch (active) {
      case "inicio": return <Inicio onNav={setActive} />;
      case "produtos": return <Produtos />;
      case "vendas": return <Vendas />;
      case "clientes": return <Clientes />;
      case "agenda": return <Agenda />;
      case "saude": return <Saude />;
      default: return null;
    }
  };

  return (
    <div className={`shell ${collapsed ? "collapsed" : ""}`}>
      <Sidebar active={active} onNav={setActive} collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="main">
        <div className="topbar">
          <h1>{TITULOS[active]}</h1>
          <div className="right">
            <a className="btn btn-ghost btn-sm" href="/vitrine" target="_blank" rel="noreferrer">Ver vitrine</a>
            <button className="icon-btn" onClick={toggle} aria-label={escuro ? "Tema claro" : "Tema escuro"} title={escuro ? "Tema claro" : "Tema escuro"}>
              {escuro ? <IcSun /> : <IcMoon />}
            </button>
            <div className="avatar">{inicial}</div>
          </div>
        </div>
        {render()}
      </div>
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();
  const [entering, setEntering] = useState(false);
  const baseline = useRef(false); // já registramos o estado inicial?
  const tinhaUser = useRef(false);

  // Mostra o splash só quando o usuário ENTRA (login/primeiro acesso),
  // não ao restaurar a sessão num reload.
  useEffect(() => {
    if (!ready) return;
    if (!baseline.current) { baseline.current = true; tinhaUser.current = !!user; return; }
    if (user && !tinhaUser.current) setEntering(true);
    tinhaUser.current = !!user;
  }, [ready, user]);

  // Vitrine pública — acessível sem login (sem splash)
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/vitrine")) {
    return <Vitrine />;
  }

  if (!ready) return null;

  return (
    <>
      {entering && <Loading onDone={() => setEntering(false)} />}
      {user ? <Shell /> : <Login />}
    </>
  );
}
