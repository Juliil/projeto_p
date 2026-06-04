const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001";

function getToken() { return localStorage.getItem("hz_token"); }
export function setToken(t) { localStorage.setItem("hz_token", t); }
export function clearToken() { localStorage.removeItem("hz_token"); }

async function req(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    let msg = "Algo deu errado";
    try { const j = await res.json(); if (typeof j.detail === "string") msg = j.detail; } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  config: () => req("/api/config", { auth: false }),
  preRegistro: (d) => req("/api/auth/pre-registro", { method: "POST", body: d, auth: false }),
  login: (d) => req("/api/auth/login", { method: "POST", body: d, auth: false }),
  me: () => req("/api/auth/me"),

  produtos: () => req("/api/produtos"),
  criarProduto: (d) => req("/api/produtos", { method: "POST", body: d }),
  atualizarProduto: (id, d) => req(`/api/produtos/${id}`, { method: "PUT", body: d }),
  removerProduto: (id) => req(`/api/produtos/${id}`, { method: "DELETE" }),

  clientes: () => req("/api/clientes"),
  criarCliente: (d) => req("/api/clientes", { method: "POST", body: d }),
  atualizarCliente: (id, d) => req(`/api/clientes/${id}`, { method: "PUT", body: d }),

  vendas: () => req("/api/vendas"),
  criarVenda: (d) => req("/api/vendas", { method: "POST", body: d }),
  confirmarVenda: (id) => req(`/api/vendas/${id}/confirmar`, { method: "PATCH" }),
  definirEntrega: (id, d) => req(`/api/vendas/${id}/entrega`, { method: "PATCH", body: d }),

  saude: () => req("/api/saude"),

  emitirNota: (vendaId) => req(`/api/nf/vendas/${vendaId}/emitir`, { method: "POST" }),

  vitrine: (loja) => req(`/api/vitrine/produtos${loja ? `?loja=${loja}` : ""}`, { auth: false }),
};

// Busca o PDF da nota com token e abre numa nova aba (blob).
export async function abrirNotaPDF(vendaId) {
  const res = await fetch(`${BASE}/api/nf/vendas/${vendaId}/pdf`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  });
  if (!res.ok) throw new Error("Não foi possível gerar a nota");
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), "_blank");
}

export const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Consulta ViaCEP (CORS liberado). Retorna campos de endereço ou lança erro.
export async function buscarCep(cep) {
  const limpo = (cep || "").replace(/\D/g, "");
  if (limpo.length !== 8) throw new Error("CEP deve ter 8 dígitos");
  const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  if (!res.ok) throw new Error("Falha ao consultar o CEP");
  const j = await res.json();
  if (j.erro) throw new Error("CEP não encontrado");
  return { cep: limpo, logradouro: j.logradouro || "", bairro: j.bairro || "", cidade: j.localidade || "", uf: j.uf || "" };
}
