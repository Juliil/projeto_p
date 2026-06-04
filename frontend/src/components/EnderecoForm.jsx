import { useState } from "react";
import { buscarCep } from "../api";
import { IcSearch } from "./Icons";

// Campos de endereço com autofill por CEP (ViaCEP). Controlado por value/onChange.
export default function EnderecoForm({ value, onChange }) {
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  const buscar = async () => {
    setErro(""); setBuscando(true);
    try {
      const r = await buscarCep(value.cep);
      onChange({ ...value, ...r });
    } catch (e) { setErro(e.message); } finally { setBuscando(false); }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="field" style={{ margin: 0 }}>
        <label>CEP</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" value={value.cep || ""} placeholder="00000-000"
            onChange={set("cep")} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscar())} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={buscar} disabled={buscando}>
            <IcSearch style={{ width: 15 }} /> {buscando ? "…" : "Buscar"}
          </button>
        </div>
        {erro && <span className="err" style={{ marginTop: 6 }}>{erro}</span>}
      </div>
      <div className="row2">
        <div className="field" style={{ margin: 0 }}><label>Logradouro</label>
          <input className="input" value={value.logradouro || ""} onChange={set("logradouro")} placeholder="Rua / Av." /></div>
        <div className="field" style={{ margin: 0 }}><label>Número</label>
          <input className="input" value={value.numero || ""} onChange={set("numero")} placeholder="123" /></div>
      </div>
      <div className="row2">
        <div className="field" style={{ margin: 0 }}><label>Bairro</label>
          <input className="input" value={value.bairro || ""} onChange={set("bairro")} /></div>
        <div className="field" style={{ margin: 0 }}><label>Complemento</label>
          <input className="input" value={value.complemento || ""} onChange={set("complemento")} placeholder="Apto, bloco…" /></div>
      </div>
      <div className="row2">
        <div className="field" style={{ margin: 0 }}><label>Cidade</label>
          <input className="input" value={value.cidade || ""} onChange={set("cidade")} /></div>
        <div className="field" style={{ margin: 0 }}><label>UF</label>
          <input className="input" value={value.uf || ""} onChange={set("uf")} maxLength={2} placeholder="AM" /></div>
      </div>
    </div>
  );
}
