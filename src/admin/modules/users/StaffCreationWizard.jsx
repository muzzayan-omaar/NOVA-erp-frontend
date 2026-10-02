import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import toast from "react-hot-toast";
import {
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Upload,
  User,
  CheckCircle2,
  Copy,
} from "lucide-react";

const STEPS = ["Basic Info", "Identification", "Employment", "Photo", "Review"];

const EDUCATION_LEVELS = [
  "Primary", "O-Level", "A-Level", "Certificate", "Diploma",
  "Bachelor's Degree", "Master's Degree", "Other",
];

export default function StaffCreationWizard() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [stores, setStores] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", gender: "", dateOfBirth: "",
    role: "CASHIER", storeId: "",
    nationalIdType: "NIN", nationalIdNumber: "", educationLevel: "",
    position: "", shift: "", hireDate: "", defaultBasicSalary: "",
    emergencyContactName: "", emergencyContactPhone: "",
    photoUrl: "",
  });

  useEffect(() => {
    api.get("/stores/options").then((res) => setStores(res.data)).catch(() => {});
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Please choose an image under 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => update("photoUrl", reader.result);
    reader.readAsDataURL(file);
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0 && form.storeId;
    return true;
  };

  const next = () => {
    if (!canProceed()) {
      toast.error("Please fill in the required fields");
      return;
    }
    setStep((s) => Math.min(s + 1, 5));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const res = await api.post("/users", form);
      setResult(res.data);
      toast.success("Staff member created");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const copyHandoff = () => {
    const text = [
      `Welcome to Novrr ERP!`,
      ``,
      `Store Code: ${result.storeCode}`,
      `Staff ID: ${result.staffId}`,
      `Temporary Password: ${result.tempPassword}`,
      ``,
      `You'll be asked to set your own password the first time you log in.`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied — ready to hand over");
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedStore = stores.find((s) => s.id === form.storeId);

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <CheckCircle2 className="mx-auto text-green-600 mb-4" size={56} />
          <h1 className="text-2xl font-bold mb-2">Staff Member Created</h1>
          <p className="text-slate-500 mb-6">
            This is the only time these details will be shown — copy them now.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="font-semibold">{result.name} — {result.role.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Store Code</p>
              <p className="font-mono font-bold text-lg">{result.storeCode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Staff ID</p>
              <p className="font-mono font-bold text-lg">{result.staffId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Temporary Password</p>
              <p className="font-mono font-bold text-lg text-red-600">{result.tempPassword}</p>
            </div>
          </div>

          <button
            onClick={copyHandoff}
            className="w-full mt-6 bg-nova-gradient text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <Copy size={18} /> {copied ? "Copied!" : "Copy All Details"}
          </button>

          <button
            onClick={() => navigate("/admin/users")}
            className="w-full mt-3 text-slate-500 py-3 font-medium"
          >
            Back to Staff List →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={18} /> Back to Staff
      </button>

      <h1 className="text-2xl font-bold flex items-center gap-3">
        <UserPlus /> Add Staff Member
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
              i + 1 === step ? "bg-nova-gradient text-white" : i + 1 < step ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
            }`}
          >
            {i + 1 < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
            {label}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow p-8">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Basic Info</h2>
            <input
              className="w-full p-3 border rounded-2xl"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="p-3 border rounded-2xl"
                placeholder="Date of birth"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
              <select
                className="p-3 border rounded-2xl"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <input
              className="w-full p-3 border rounded-2xl"
              placeholder="Email (optional — not used for login)"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                className="p-3 border rounded-2xl"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                <option value="CASHIER">Cashier</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="GENERAL_MANAGER">General Manager</option>
              </select>
              <select
                className="p-3 border rounded-2xl"
                value={form.storeId}
                onChange={(e) => update("storeId", e.target.value)}
              >
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Identification</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => update("nationalIdType", "NIN")}
                className={`flex-1 p-3 rounded-2xl border font-medium ${form.nationalIdType === "NIN" ? "border-nova-blue bg-blue-50" : "border-slate-200"}`}
              >
                National ID (NIN)
              </button>
              <button
                type="button"
                onClick={() => update("nationalIdType", "PASSPORT")}
                className={`flex-1 p-3 rounded-2xl border font-medium ${form.nationalIdType === "PASSPORT" ? "border-nova-blue bg-blue-50" : "border-slate-200"}`}
              >
                Passport
              </button>
            </div>
            <input
              className="w-full p-3 border rounded-2xl"
              placeholder={form.nationalIdType === "NIN" ? "NIN number" : "Passport number"}
              value={form.nationalIdNumber}
              onChange={(e) => update("nationalIdNumber", e.target.value)}
            />
            <select
              className="w-full p-3 border rounded-2xl"
              value={form.educationLevel}
              onChange={(e) => update("educationLevel", e.target.value)}
            >
              <option value="">Education level</option>
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Employment & Salary</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                className="p-3 border rounded-2xl"
                placeholder="Position / job title"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
              />
              <select
                className="p-3 border rounded-2xl"
                value={form.shift}
                onChange={(e) => update("shift", e.target.value)}
              >
                <option value="">Select shift</option>
                <option value="Day">Day</option>
                <option value="Night">Night</option>
                <option value="Rotating">Rotating</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                className="p-3 border rounded-2xl"
                placeholder="Hire date"
                value={form.hireDate}
                onChange={(e) => update("hireDate", e.target.value)}
              />
              <input
                type="number"
                className="p-3 border rounded-2xl"
                placeholder="Default basic salary (UGX)"
                value={form.defaultBasicSalary}
                onChange={(e) => update("defaultBasicSalary", e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-400">
              This pre-fills their salary when you run payroll — it can still be adjusted per pay run.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <input
                className="p-3 border rounded-2xl"
                placeholder="Emergency contact name"
                value={form.emergencyContactName}
                onChange={(e) => update("emergencyContactName", e.target.value)}
              />
              <input
                className="p-3 border rounded-2xl"
                placeholder="Emergency contact phone"
                value={form.emergencyContactPhone}
                onChange={(e) => update("emergencyContactPhone", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Photo</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-slate-200">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Staff" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-400" />
                )}
              </div>
              <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-5 py-3 rounded-2xl cursor-pointer font-medium text-sm">
                <Upload size={16} /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
              <p className="text-xs text-slate-400">Optional — used for their employee ID card. Max 3MB.</p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Review</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200 flex-shrink-0">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Staff" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-slate-400" />
                )}
              </div>
              <div>
                <p className="font-bold">{form.name}</p>
                <p className="text-sm text-slate-500">{form.position || form.role.replace(/_/g, " ")}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Role</span><span className="font-medium">{form.role.replace(/_/g, " ")}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Store</span><span className="font-medium">{selectedStore?.name}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">National ID</span><span className="font-medium">{form.nationalIdType}: {form.nationalIdNumber || "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Education</span><span className="font-medium">{form.educationLevel || "—"}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Shift</span><span className="font-medium">{form.shift || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Default Salary</span><span className="font-medium">{form.defaultBasicSalary ? `UGX ${Number(form.defaultBasicSalary).toLocaleString()}` : "—"}</span></div>
            </div>

            <button
              onClick={handleCreate}
              disabled={submitting}
              className="w-full mt-4 bg-green-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Staff Member"}
            </button>
          </div>
        )}

        {step < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={back}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-slate-500 disabled:opacity-30"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-nova-gradient text-white font-semibold"
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}