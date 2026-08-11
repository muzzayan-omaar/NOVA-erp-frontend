import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { ArrowLeft, Building2, ShieldOff, ShieldCheck } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setTenantAuth = useAuthStore((s) => s.setAuth);

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await platformApi.get(`/platform/companies/${id}`);
      setCompany(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const toggleStatus = async () => {
    const nextActive = !company.isActive;
    const confirmMsg = nextActive
      ? "Reactivate this company? Their staff will be able to log in again immediately."
      : "Suspend this company? Every user there will be locked out immediately, including anyone currently logged in.";

    if (!window.confirm(confirmMsg)) return;

    try {
      setUpdating(true);
      await platformApi.patch(`/platform/companies/${id}/status`, {
        isActive: nextActive,
      });
      toast.success(nextActive ? "Company reactivated" : "Company suspended");
      fetchCompany();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleInvestigate = async () => {
    const confirmed = window.confirm(
      "This opens a new tab logged in as this company's General Manager, for support purposes. " +
        "This is permanently logged and visible in the Platform Audit Log. " +
        "If you have a real tenant session open in another tab of this browser, it will be overwritten. Continue?"
    );
    if (!confirmed) return;

    try {
      const res = await platformApi.post(`/platform/companies/${id}/investigate`);
      setTenantAuth(res.data.user, res.data.token);
      window.open("/admin", "_blank");
      toast.success("Investigation started — check the new tab");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to start investigation"
      );
    }
  };

  const saveBusinessCode = async () => {
    try {
      await platformApi.patch(`/platform/companies/${id}/business-code`, {
        businessCode: codeInput,
      });
      toast.success("Business code updated");
      setEditingCode(false);
      fetchCompany();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update business code");
    }
  };

  // Early returns ONLY after all hooks
  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!company) return <p className="text-center py-20">Company not found</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/platform/companies")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Companies
      </button>

      <div className="bg-white rounded-3xl shadow p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Building2 /> {company.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {company.email || "—"} · {company.phone || "—"} ·{" "}
              {company.country || "—"}
            </p>

            {/* Business Code */}
            <div className="mt-2 flex items-center gap-2">
              {editingCode ? (
                <>
                  <input
                    className="p-2 border rounded-xl text-sm font-mono uppercase"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                  />
                  <button
                    onClick={saveBusinessCode}
                    className="text-sm bg-blue-600 text-white px-3 py-2 rounded-xl"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCode(false)}
                    className="text-sm px-3 py-2"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="font-mono bg-slate-100 px-3 py-1 rounded-lg text-sm font-semibold">
                    {company.businessCode || "No code set"}
                  </span>
                  <button
                    onClick={() => {
                      setCodeInput(company.businessCode || "");
                      setEditingCode(true);
                    }}
                    className="text-xs text-blue-600 underline"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            <p className="text-slate-400 text-xs mt-1">
              Joined {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleInvestigate}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-slate-900 text-white hover:bg-slate-800"
            >
              Investigate as GM
            </button>

            <button
              onClick={toggleStatus}
              disabled={updating}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold disabled:opacity-50 ${
                company.isActive
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {company.isActive ? (
                <ShieldOff size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}
              {company.isActive ? "Suspend Company" : "Reactivate Company"}
            </button>
          </div>
        </div>

        {!company.isActive && (
          <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
            This company is currently suspended — no user there can log in or
            access the API.
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-lg font-bold mb-4">Subscription</h2>
        {company.subscription ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Plan</p>
              <p className="font-semibold">{company.subscription.plan}</p>
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              <p className="font-semibold">{company.subscription.status}</p>
            </div>
            <div>
              <p className="text-slate-500">Ends</p>
              <p className="font-semibold">
                {new Date(company.subscription.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No subscription record</p>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-lg font-bold mb-4">
          Stores ({company.stores?.length ?? 0})
        </h2>
        <div className="space-y-2">
          {company.stores?.map((s) => (
            <div
              key={s.id}
              className="flex justify-between text-sm border-b py-2"
            >
              <span>
                {s.name}{" "}
                {s.isHeadOffice && (
                  <span className="text-xs text-slate-400">(Head Office)</span>
                )}
              </span>
              <span className="text-slate-500">{s.location || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-lg font-bold mb-4">
          Users ({company.users?.length ?? 0})
        </h2>
        <div className="space-y-2">
          {company.users?.map((u) => (
            <div
              key={u.id}
              className="flex justify-between items-center text-sm border-b py-2"
            >
              <div>
                <span className="font-medium">{u.name}</span>
                <span className="text-slate-400 ml-2">{u.email}</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        <h2 className="text-lg font-bold mb-4">Payment History</h2>
        {company.payments?.length === 0 ? (
          <p className="text-slate-500 text-sm">No payments yet</p>
        ) : (
          <div className="space-y-2">
            {company.payments?.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-sm border-b py-2"
              >
                <span>
                  UGX {Number(p.amount).toLocaleString()} —{" "}
                  {p.method.replace("_", " ")}
                </span>
                <span className="text-slate-500">
                  {p.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}