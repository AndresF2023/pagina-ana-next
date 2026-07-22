"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  getStaffAccounts, createStaffAccount, deleteStaffAccount,
  getAdminAccounts, createAdminAccount, deleteAdminAccount,
} from "./actions";

type Account = { id: string; email: string };

function AccountSection({
  title,
  badge,
  badgeColor,
  description,
  formDescription,
  emailPlaceholder,
  createLabel,
  creatingLabel,
  accounts,
  loading,
  onCreate,
  onDelete,
  isPendingCreate,
  isPendingDelete,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  formDescription: string;
  emailPlaceholder: string;
  createLabel: string;
  creatingLabel: string;
  accounts: Account[];
  loading: boolean;
  onCreate: (email: string, password: string) => Promise<{ error: string } | null>;
  onDelete: (id: string) => Promise<{ error: string } | null>;
  isPendingCreate: boolean;
  isPendingDelete: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [list, setList] = useState<Account[]>(accounts);

  useEffect(() => { setList(accounts); }, [accounts]);

  const inputClass = "border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500";
  const btnPrimary = "bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed self-start";

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setSuccess(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) { setError("Completá email y contraseña."); return; }
    const result = await onCreate(email, password);
    if (result?.error) { setError(result.error); } else {
      setSuccess(`Cuenta creada para ${email}`);
      setList((prev) => [...prev, { id: crypto.randomUUID(), email }]);
      formRef.current?.reset();
    }
  }

  async function handleDelete(id: string, email: string) {
    setError(null); setSuccess(null);
    const result = await onDelete(id);
    if (result?.error) { setError(result.error); } else {
      setSuccess(`Cuenta de ${email} eliminada.`);
      setList((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Formulario */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
        <form ref={formRef} onSubmit={handleCreate} noValidate className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">{formDescription}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" placeholder={emailPlaceholder} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <input name="password" type="password" placeholder="Mínimo 6 caracteres" className={inputClass} />
            </div>
          </div>
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">{success}</p>}
          <button type="submit" disabled={isPendingCreate} className={btnPrimary}>
            {isPendingCreate ? creatingLabel : createLabel}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">Cuentas activas</h2>
        <p className="text-xs text-slate-400 mb-4">{description}</p>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-xl py-6">
            No hay cuentas creadas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColor}`}>{badge}</span>
                  <span className="text-sm text-slate-700">{a.email}</span>
                </div>
                <button type="button" disabled={isPendingDelete}
                  onClick={() => handleDelete(a.id, a.email)}
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

export default function AdminPage() {
  const [adminAccounts, setAdminAccounts] = useState<Account[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startAdminTransition] = useTransition();
  const [, startStaffTransition] = useTransition();

  useEffect(() => {
    Promise.all([getAdminAccounts(), getStaffAccounts()]).then(([admins, staff]) => {
      setAdminAccounts(admins);
      setStaffAccounts(staff);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-xl flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Administración</h1>
        <p className="text-slate-500 text-sm">Gestioná las cuentas de acceso al sistema.</p>
      </div>

      {/* Admins */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Administradores</h2>
        <AccountSection
          title="Nueva cuenta de Administrador"
          badge="Admin"
          badgeColor="bg-purple-100 text-purple-700"
          description="Los administradores pueden ver y editar todo, y gestionar cuentas de staff."
          formDescription="El administrador puede ver y editar toda la información, y crear o eliminar cuentas de staff."
          emailPlaceholder="admin@email.com"
          createLabel="Crear cuenta de Administrador"
          creatingLabel="Creando..."
          accounts={adminAccounts}
          loading={loading}
          onCreate={createAdminAccount}
          onDelete={deleteAdminAccount}
          isPendingCreate={false}
          isPendingDelete={false}
        />
      </div>

      <hr className="border-slate-200" />

      {/* Staff */}
      <div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Staff</h2>
        <AccountSection
          title="Nueva cuenta de Staff"
          badge="Staff"
          badgeColor="bg-sky-100 text-sky-700"
          description="El staff puede ver toda la información pero no puede editar nada."
          formDescription="El staff puede ver toda la información de los jugadores/as pero no puede editar nada."
          emailPlaceholder="staff@email.com"
          createLabel="Crear cuenta de Staff"
          creatingLabel="Creando..."
          accounts={staffAccounts}
          loading={loading}
          onCreate={createStaffAccount}
          onDelete={deleteStaffAccount}
          isPendingCreate={false}
          isPendingDelete={false}
        />
      </div>
    </div>
  );
}
