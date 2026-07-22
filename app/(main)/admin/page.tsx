"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getStaffAccounts, createStaffAccount, deleteStaffAccount } from "./actions";

export default function AdminPage() {
  const [staffList, setStaffList] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const inputClass = "border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500";
  const btnPrimary = "bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed";

  useEffect(() => {
    getStaffAccounts().then((list) => { setStaffList(list); setLoading(false); });
  }, []);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setSuccess(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) { setError("Completá email y contraseña."); return; }
    startTransition(async () => {
      const result = await createStaffAccount(email, password);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(`Cuenta creada para ${email}`);
        formRef.current?.reset();
        const list = await getStaffAccounts();
        setStaffList(list);
      }
    });
  }

  function handleDelete(id: string, email: string) {
    setError(null); setSuccess(null);
    startDeleteTransition(async () => {
      const result = await deleteStaffAccount(id);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(`Cuenta de ${email} eliminada.`);
        setStaffList((prev) => prev.filter((s) => s.id !== id));
      }
    });
  }

  return (
    <div className="max-w-xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Administración</h1>
        <p className="text-slate-500 text-sm">Gestioná las cuentas de staff con acceso de solo lectura.</p>
      </div>

      {/* Crear cuenta staff */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Nueva cuenta de Staff</h2>
        <form ref={formRef} onSubmit={handleCreate} noValidate className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">
            El staff puede ver toda la información de los jugadores/as pero no puede editar nada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" placeholder="staff@email.com" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <input name="password" type="password" placeholder="Mínimo 6 caracteres" className={inputClass} />
            </div>
          </div>
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">{success}</p>}
          <button type="submit" disabled={isPending} className={`${btnPrimary} self-start`}>
            {isPending ? "Creando..." : "Crear cuenta de Staff"}
          </button>
        </form>
      </div>

      {/* Lista de staff */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Cuentas de Staff activas</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : staffList.length === 0 ? (
          <p className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-xl py-6">
            No hay cuentas de staff creadas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {staffList.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-medium">Staff</span>
                  <span className="text-sm text-slate-700">{s.email}</span>
                </div>
                <button type="button" disabled={isPendingDelete}
                  onClick={() => handleDelete(s.id, s.email)}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
