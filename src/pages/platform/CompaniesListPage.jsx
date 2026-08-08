import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import platformApi from "../../services/platformApi";
import toast from "react-hot-toast";
import { Building2, Store, Users } from "lucide-react";

const statusStyles = {
  TRIALING: "bg-blue-100 text-blue-600",
  ACTIVE: "bg-green-100 text-green-600",
  EXPIRED: "bg-red-100 text-red-600",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export default function CompaniesListPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await platformApi.get("/platform/companies");
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Building2 /> Companies
        </h1>
        <input
          placeholder="Search companies..."
          className="p-3 border rounded-2xl w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow p-4">
        {loading ? (
          <p className="text-center py-16">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-slate-500">No companies found</p>
        ) : (
          <div className="divide-y">
            {filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/platform/companies/${c.id}`)}
                className="flex justify-between items-center py-4 px-2 cursor-pointer hover:bg-slate-50 rounded-xl"
              >
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {c.country || "—"} · Joined {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Store size={14} /> {c._count?.stores ?? 0}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Users size={14} /> {c._count?.users ?? 0}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusStyles[c.subscription?.status] || "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.subscription?.status || "NO SUB"}
                  </span>

                  {!c.isActive && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                      SUSPENDED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}