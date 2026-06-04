import { useEffect, useState } from "react";
import { api, brl } from "../api";
import { IcBag } from "../components/Icons";

export default function Vitrine() {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loja = params.get("loja");
    api.vitrine(loja).then(setData).catch((e) => setErro(e.message));
  }, []);

  if (erro) return <div className="vitrine"><div className="vitrine__wrap"><div className="err">{erro}</div></div></div>;
  if (!data) return <div className="vitrine"><div className="vitrine__wrap"><div className="empty">Carregando vitrine…</div></div></div>;

  return (
    <div className="vitrine">
      <div className="vitrine__hero">
        <h1>{data.loja.nome.toUpperCase()}</h1>
        <p>Bolsas & acessórios · {data.loja.cidade}</p>
      </div>
      <div className="vitrine__wrap">
        {data.produtos.length === 0 ? (
          <div className="empty">Nenhuma peça disponível no momento. Volte em breve 💛</div>
        ) : (
          <div className="shelf">
            {data.produtos.map((p) => (
              <div key={p.id} className="bag-card">
                <div className="thumb" style={p.foto_url ? { backgroundImage: `url(${p.foto_url})` } : null}>
                  {!p.foto_url && <IcBag style={{ width: 48 }} />}
                </div>
                <div className="body">
                  <h4>{p.nome}</h4>
                  <span className="cat">{p.categoria}</span>
                  {p.descricao && <span className="muted" style={{ fontSize: 12.5 }}>{p.descricao}</span>}
                  <span className="pr">{brl(p.preco_venda)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="muted" style={{ textAlign: "center", marginTop: 32, fontSize: 13 }}>
          Para comprar, chame no Instagram <b>@hazakmao</b> 💬
        </p>
      </div>
    </div>
  );
}
