"use client";
import { useCallback, useEffect, useState } from "react";
import Header from "../../components/Header";
import ModelForm from "../../components/ModelForm";
import { getSupabase } from "../../lib/supabase";
import { fetchModels } from "../../lib/queries";
import { BUCKET, money, tipoLabel, subtipoLabel } from "../../lib/constants";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [loginMsg, setLoginMsg] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [models, setModels] = useState([]);
  const [editing, setEditing] = useState(null); // null | "new" | modelo
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  // La verificación real la hacen las políticas RLS de Supabase;
  // esto solo decide qué pantalla mostrar.
  const isAdmin = !!session && (session.user.email || "").toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && !isAdmin) {
      getSupabase().auth.signOut();
      setLoginMsg("Esta cuenta no tiene permisos de administrador");
    }
  }, [session, isAdmin]);

  const load = useCallback(async () => {
    try {
      setModels(await fetchModels());
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  async function login(e) {
    e.preventDefault();
    setLoginMsg("");
    setLoggingIn(true);
    const form = new FormData(e.currentTarget);
    const { error } = await getSupabase().auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password"))
    });
    setLoggingIn(false);
    if (error) setLoginMsg("Email o contraseña incorrectos");
  }

  async function adjustStock(variant, delta) {
    const stock = Math.max(0, variant.stock + delta);
    const { error } = await getSupabase().from("catalog_variants").update({ stock }).eq("id", variant.id);
    if (error) return alert(error.message);
    setModels(ms => ms.map(m => ({
      ...m,
      colors: m.colors.map(c => ({
        ...c,
        variants: c.variants.map(v => (v.id === variant.id ? { ...v, stock } : v))
      }))
    })));
  }

  async function removeModel(m) {
    if (!confirm(`¿Eliminar "${m.nombre}" con todos sus colores y fotos?`)) return;
    const sb = getSupabase();
    const paths = m.colors.flatMap(c => c.images.map(i => i.path));
    const { error } = await sb.from("catalog_models").delete().eq("id", m.id);
    if (error) return alert(error.message);
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    load();
  }

  const lista = models.filter(m =>
    !q.trim() || `${m.nombre} ${m.marca}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <>
      <Header current="admin">
        {isAdmin && (
          <button className="link" style={{ color: "var(--bad)" }} onClick={() => getSupabase().auth.signOut()}>
            Salir
          </button>
        )}
      </Header>
      <main>
        {!ready && <div className="empty">Cargando...</div>}

        {ready && !isAdmin && (
          <div className="card login">
            <h2 style={{ marginTop: 0 }}>Ingresar</h2>
            <form onSubmit={login}>
              <label>Email<input name="email" type="email" required autoComplete="username" /></label>
              <label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
              <button type="submit" disabled={loggingIn}>{loggingIn ? "Entrando..." : "Entrar"}</button>
              {loginMsg && <div className="msg err">{loginMsg}</div>}
            </form>
          </div>
        )}

        {ready && isAdmin && (
          <>
            {editing ? (
              <ModelForm
                key={editing === "new" ? "new" : editing.id}
                model={editing === "new" ? null : editing}
                onCancel={() => setEditing(null)}
                onSaved={() => { setEditing(null); load(); }}
              />
            ) : (
              <div className="row" style={{ marginBottom: 18 }}>
                <button onClick={() => setEditing("new")}>+ Nuevo modelo</button>
              </div>
            )}

            <div className="card">
              <label style={{ maxWidth: 300, marginBottom: 14 }}>Buscar
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Modelo o marca..." />
              </label>
              {error && <div className="msg err" style={{ marginBottom: 10 }}>{error}</div>}
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Foto</th><th>Modelo</th><th>Tipo</th><th>Precio</th>
                      <th>Colores / talles / stock</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.length === 0 && (
                      <tr><td colSpan={6} className="empty">Sin resultados</td></tr>
                    )}
                    {lista.map(m => {
                      const thumb = m.colors.flatMap(c => c.images)[0];
                      return (
                        <tr key={m.id}>
                          <td>{thumb ? <img className="thumb-sm" src={thumb.url} alt="" /> : "—"}</td>
                          <td><b>{m.nombre}</b><div className="meta">{m.marca}</div></td>
                          <td>
                            <span className="badge">
                              {tipoLabel(m.tipo)}{m.subtipo ? ` · ${subtipoLabel(m.subtipo)}` : ""}
                            </span>
                          </td>
                          <td>{money(m.precio)}</td>
                          <td>
                            {m.colors.map(c => (
                              <div key={c.id} style={{ marginBottom: 10 }}>
                                <b>{c.color}</b> <span className="meta">({c.images.length} fotos)</span>
                                {c.variants.map(v => (
                                  <div className="stock-line" key={v.id}>
                                    <span className="badge">{v.talle}</span>
                                    <button className="small sec" onClick={() => adjustStock(v, -1)}>−</button>
                                    <b className={v.stock > 0 ? "ok-txt" : "no-txt"}>{v.stock}</b>
                                    <button className="small sec" onClick={() => adjustStock(v, 1)}>+</button>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </td>
                          <td>
                            <div className="row">
                              <button className="small" onClick={() => { setEditing(m); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button>
                              <button className="small danger" onClick={() => removeModel(m)}>Borrar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
