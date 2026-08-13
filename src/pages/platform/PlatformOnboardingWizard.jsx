import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import {
  Building2,
  Package as PackageIcon,
  Layers,
  Calendar,
  Store as StoreIcon,
  User,
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const STEPS = [
  "Business & Contact",
  "Package",
  "Extra Bundles",
  "Billing Cycle",
  "First Store",
  "First User",
  "Review",
];

export default function PlatformOnboardingWizard() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [catalog, setCatalog] = useState({ bundles: [], packages: [], billingCycles: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [repConfirmedClientAgreed, setRepConfirmedClientAgreed] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    email: "",
    country: "Uganda",
    currency: "UGX",
    packageCode: "",
    extraBundleCodes: [],
    billingCycleCode: "",
    storeName: "Head Office",
    storeLocation: "",
    gmName: "",
    gmEmail: "",
    gmPhone: "",
  });

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [bundlesRes, packagesRes, cyclesRes] = await Promise.all([
          platformApi.get("/platform/bundles"),
          platformApi.get("/platform/packages"),
          platformApi.get("/platform/billing-cycles"),
        ]);
        const bundles = bundlesRes.data.filter((b) => b.isActive);
        const packages = packagesRes.data.filter((p) => p.isActive);
        const billingCycles = cyclesRes.data.filter((c) => c.isActive);

        setCatalog({ bundles, packages, billingCycles });
        setForm((f) => ({
          ...f,
          packageCode: packages[0]?.code || "",
          billingCycleCode: billingCycles[0]?.code || "",
        }));
      } catch (err) {
        toast.error("Failed to load catalog");
      } finally {
        setLoadingCatalog(false);
      }
    };
    loadCatalog();
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleBundle = (code) => {
    setForm((f) => ({
      ...f,
      extraBundleCodes: f.extraBundleCodes.includes(code)
        ? f.extraBundleCodes.filter((c) => c !== code)
        : [...f.extraBundleCodes, code],
    }));
  };

  const selectedPackage = catalog.packages.find((p) => p.code === form.packageCode);
  const selectedBundles = catalog.bundles.filter((b) => form.extraBundleCodes.includes(b.code));
  const selectedCycle = catalog.billingCycles.find((c) => c.code === form.billingCycleCode);

  const packageIncludedCodes = selectedPackage?.includedBundles?.map((b) => b.code) || [];
  const availableExtraBundles = catalog.bundles.filter((b) => !packageIncludedCodes.includes(b.code));

  const monthlyTotal = (selectedPackage?.price || 0) + selectedBundles.reduce((sum, b) => sum + b.price, 0);
  const chargeAmount = monthlyTotal * (selectedCycle?.payMonths || 0);
  const totalMonths = (selectedCycle?.payMonths || 0) + (selectedCycle?.bonusMonths || 0);
  const previewEndDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + totalMonths);
    return d;
  })();

  const canProceed = () => {
    if (step === 1) return form.companyName.trim().length > 0;
    if (step === 2) return Boolean(form.packageCode);
    if (step === 4) return Boolean(form.billingCycleCode);
    if (step === 5) return form.storeName.trim().length > 0;
    if (step === 6) return form.gmName.trim().length > 0 && form.gmEmail.trim().length > 0;
    return true;
  };

  const next = () => {
    if (!canProceed()) {
      toast.error("Please fill in the required fields");
      return;
    }
    setStep((s) => Math.min(s + 1, 7));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const res = await platformApi.post("/platform/companies", { ...form, repConfirmedClientAgreed });
      setResult(res.data);
      toast.success("Company created");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create company");
    } finally {
      setSubmitting(false);
    }
  };

  const copyHandoff = () => {
    const text = [
      `Welcome to Nova ERP!`,
      ``,
      `Business Code: ${result.businessCode}`,
      `Login Email: ${result.gmEmail}`,
      `Temporary Password: ${result.tempPassword}`,
      ``,
      `You'll be asked to set a new password the first time you log in.`,
      `Coverage until: ${new Date(result.coverageEndDate).toLocaleDateString()}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied — ready to send");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingCatalog) {
    return <p className="text-center py-20">Loading catalog...</p>;
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <CheckCircle2 className="mx-auto text-green-600 mb-4" size={56} />
          <h1 className="text-2xl font-bold mb-2">Company Created</h1>
          <p className="text-slate-500 mb-6">
            This is the only time these details will be shown — copy them now.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3">
            <div>
              <p className="text-xs text-slate-500">Business Code</p>
              <p className="font-mono font-bold text-lg">{result.businessCode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">GM Login Email</p>
              <p className="font-semibold">{result.gmEmail}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Temporary Password</p>
              <p className="font-mono font-bold text-lg text-red-600">{result.tempPassword}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Charged</p>
              <p className="font-semibold">UGX {Number(result.chargeAmount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Covered Until</p>
              <p className="font-semibold">{new Date(result.coverageEndDate).toLocaleDateString()}</p>
            </div>
          </div>

          <button
            onClick={copyHandoff}
            className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <Copy size={18} /> {copied ? "Copied!" : "Copy All Details"}
          </button>

          <button
            onClick={() => navigate(`/platform/companies/${result.companyId}`)}
            className="w-full mt-3 text-slate-500 py-3 font-medium"
          >
            View Company →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-6">
        <Sparkles /> Onboard New Company
      </h1>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
              i + 1 === step
                ? "bg-blue-600 text-white"
                : i + 1 < step
                ? "bg-green-100 text-green-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {i + 1 < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-3xl shadow p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Building2 size={20} /> Business & Contact</h2>
              <input className="w-full p-3 border rounded-2xl" placeholder="Company Name"
                value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <input className="p-3 border rounded-2xl" placeholder="Phone"
                  value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                <input className="p-3 border rounded-2xl" placeholder="Email"
                  value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input className="p-3 border rounded-2xl" placeholder="Country"
                  value={form.country} onChange={(e) => update("country", e.target.value)} />
                <input className="p-3 border rounded-2xl" placeholder="Currency"
                  value={form.currency} onChange={(e) => update("currency", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><PackageIcon size={20} /> Choose a Package</h2>
              <div className="space-y-3">
                {catalog.packages.map((p) => (
                  <button
                    key={p.code}
                    onClick={() => update("packageCode", p.code)}
                    className={`w-full text-left p-5 rounded-2xl border transition ${
                      form.packageCode === p.code ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-sm text-slate-500">{p.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {p.maxStores} store(s) · {p.maxUsers} user(s)
                        </p>
                        {p.includedBundles?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.includedBundles.map((b) => (
                              <span key={b.id} className="text-xs bg-white border px-2 py-1 rounded-lg">{b.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="font-bold">UGX {Number(p.price).toLocaleString()}/mo</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Layers size={20} /> Extra Bundles</h2>
              <p className="text-sm text-slate-500">Optional — add on top of {selectedPackage?.name}.</p>

              {packageIncludedCodes.length > 0 && (
                <div className="bg-green-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-green-700 mb-2">Already included</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.includedBundles.map((b) => (
                      <span key={b.id} className="text-xs bg-white px-3 py-2 rounded-xl border">{b.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {availableExtraBundles.map((b) => (
                  <button
                    key={b.code}
                    onClick={() => toggleBundle(b.code)}
                    className={`w-full text-left p-4 rounded-2xl border transition flex justify-between items-center ${
                      form.extraBundleCodes.includes(b.code) ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.description}</p>
                    </div>
                    <p className="font-semibold">+UGX {Number(b.price).toLocaleString()}/mo</p>
                  </button>
                ))}
                {availableExtraBundles.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">Every bundle is already included in this package.</p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Calendar size={20} /> Billing Cycle</h2>
              <div className="space-y-3">
                {catalog.billingCycles.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => update("billingCycleCode", c.code)}
                    className={`w-full text-left p-5 rounded-2xl border transition ${
                      form.billingCycleCode === c.code ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <p className="font-bold">{c.name}</p>
                    <p className="text-sm text-slate-500">
                      Pay for {c.payMonths} month(s){c.bonusMonths > 0 ? `, get ${c.bonusMonths} free` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><StoreIcon size={20} /> First Store</h2>
              <input className="w-full p-3 border rounded-2xl" placeholder="Store Name (e.g. Head Office)"
                value={form.storeName} onChange={(e) => update("storeName", e.target.value)} />
              <input className="w-full p-3 border rounded-2xl" placeholder="Location"
                value={form.storeLocation} onChange={(e) => update("storeLocation", e.target.value)} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><User size={20} /> First User (General Manager)</h2>
              <input className="w-full p-3 border rounded-2xl" placeholder="Full Name"
                value={form.gmName} onChange={(e) => update("gmName", e.target.value)} />
              <input className="w-full p-3 border rounded-2xl" placeholder="Email (this becomes their login)"
                value={form.gmEmail} onChange={(e) => update("gmEmail", e.target.value)} />
              <input className="w-full p-3 border rounded-2xl" placeholder="Phone"
                value={form.gmPhone} onChange={(e) => update("gmPhone", e.target.value)} />
              <p className="text-xs text-slate-400">
                A temporary password is generated automatically — you'll relay it after creation.
              </p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Review</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Company</span><span className="font-medium">{form.companyName}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Package</span><span className="font-medium">{selectedPackage?.name}</span></div>
                {selectedBundles.length > 0 && (
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Extra Bundles</span><span className="font-medium">{selectedBundles.map((b) => b.name).join(", ")}</span></div>
                )}
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Billing</span><span className="font-medium">{selectedCycle?.name}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Store</span><span className="font-medium">{form.storeName}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-slate-500">GM</span><span className="font-medium">{form.gmName} ({form.gmEmail})</span></div>
                <div className="flex justify-between border-b pb-2 text-base"><span className="font-semibold">Total Charge</span><span className="font-bold">UGX {chargeAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-base"><span className="font-semibold">Covered Until</span><span className="font-bold">{previewEndDate.toLocaleDateString()}</span></div>
              </div>
                <label className="flex items-start gap-3 text-sm text-slate-600 mt-4 pt-4 border-t">
  <input
    type="checkbox"
    checked={repConfirmedClientAgreed}
    onChange={(e) => setRepConfirmedClientAgreed(e.target.checked)}
    className="mt-1"
  />
  <span>
    I confirm this client has been informed of and agreed to Nova's{" "}
    <a href="/terms" target="_blank" className="underline text-blue-600">Terms of Service</a>{" "}
    and{" "}
    <a href="/privacy" target="_blank" className="underline text-blue-600">Privacy Policy</a>.
  </span>
                </label>

                <button
                  onClick={handleCreate}
                  disabled={submitting || !repConfirmedClientAgreed}
                  className="w-full mt-4 bg-green-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Company"}
                </button>
            </div>
          )}

          {step < 7 && (
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
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow p-6 h-fit sticky top-6">
          <h3 className="font-bold mb-4 text-sm text-slate-500 uppercase tracking-wide">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Package</span>
              <span className="font-medium">{selectedPackage?.name || "—"}</span>
            </div>
            {selectedBundles.map((b) => (
              <div key={b.code} className="flex justify-between">
                <span className="text-slate-500">+ {b.name}</span>
                <span className="font-medium">UGX {b.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-3">
              <span className="text-slate-500">Monthly</span>
              <span className="font-bold">UGX {monthlyTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cycle</span>
              <span className="font-medium">{selectedCycle?.name || "—"}</span>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <span className="font-semibold">Total Due</span>
              <span className="font-bold">UGX {chargeAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Covers until</span>
              <span>{previewEndDate.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}