// Guarda os pedidos. Usa Upstash Redis quando configurado;
// senão, guarda na memória (só serve para testar: some ao reiniciar).
import { Redis } from '@upstash/redis';
import { config } from './config';

let redis = null;
function getRedis() {
  const c = config();
  if (!c.redisUrl || !c.redisToken) return null;
  if (!redis) redis = new Redis({ url: c.redisUrl, token: c.redisToken });
  return redis;
}

const mem = globalThis.__cantaiMem || (globalThis.__cantaiMem = { kv: new Map(), exp: new Map(), index: [] });

function memGet(k) {
  const e = mem.exp.get(k);
  if (e && e < Date.now()) {
    mem.kv.delete(k);
    mem.exp.delete(k);
  }
  return mem.kv.get(k);
}

const KEY = (id) => `pedido:${id}`;

export async function getPedido(id) {
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id || '')) return null;
  const r = getRedis();
  if (r) return (await r.get(KEY(id))) || null;
  const v = memGet(KEY(id));
  return v ? JSON.parse(v) : null;
}

export async function savePedido(p) {
  p.atualizadoEm = new Date().toISOString();
  const r = getRedis();
  if (r) {
    await r.set(KEY(p.id), p);
    await r.zadd('pedidos', { score: Date.parse(p.criadoEm), member: p.id });
  } else {
    mem.kv.set(KEY(p.id), JSON.stringify(p));
    if (!mem.index.includes(p.id)) mem.index.push(p.id);
  }
  return p;
}

// Atualiza um pedido lendo a versão mais recente antes
export async function updatePedido(id, fn) {
  const p = await getPedido(id);
  if (!p) return null;
  const novo = (await fn(p)) || p;
  return savePedido(novo);
}

export async function listPedidos(limite = 100) {
  const r = getRedis();
  let ids;
  if (r) ids = await r.zrange('pedidos', 0, limite - 1, { rev: true });
  else ids = [...mem.index].reverse().slice(0, limite);
  const lista = await Promise.all(ids.map((id) => getPedido(id)));
  return lista.filter(Boolean);
}

// Trava simples para não gerar a mesma música duas vezes
export async function lock(nome, segundos) {
  const r = getRedis();
  const k = `lock:${nome}`;
  if (r) return (await r.set(k, '1', { nx: true, ex: segundos })) === 'OK';
  if (memGet(k)) return false;
  mem.kv.set(k, '1');
  mem.exp.set(k, Date.now() + segundos * 1000);
  return true;
}

export async function unlock(nome) {
  const r = getRedis();
  const k = `lock:${nome}`;
  if (r) await r.del(k);
  else mem.kv.delete(k);
}

// Limite de uso por IP (protege seu saldo de IA)
export async function contarUso(chave, limite, segundos) {
  const r = getRedis();
  const k = `uso:${chave}`;
  let n;
  if (r) {
    n = await r.incr(k);
    if (n === 1) await r.expire(k, segundos);
  } else {
    n = Number(memGet(k) || 0) + 1;
    mem.kv.set(k, String(n));
    if (n === 1) mem.exp.set(k, Date.now() + segundos * 1000);
  }
  return n <= limite;
}
