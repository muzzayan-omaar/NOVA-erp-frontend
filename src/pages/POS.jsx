import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import {
  ShoppingCart,
  LogOut,
  Search,
  X,
  Loader2,
  LayoutDashboard,
  WifiOff,
  CloudUpload,
  AlertCircle,
  UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ReceiptModal from "../components/pos/ReceiptModal";
import BarcodeScanner from "../components/pos/BarcodeScanner";
import { hasPermission } from "../utils/hasPermission";
import useOfflineSalesSync from "../hooks/useOfflineSalesSync";
import { addToQueue } from "../utils/offlineQueue";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const { isOnline, pendingCount, failedCount, syncNow } = useOfflineSalesSync();

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Fetch products + customers
  useEffect(() => {
    fetchProducts();
    api
      .get("/customers")
      .then((res) => setCustomers(res.data))
      .catch(() => {});
  }, []);

  const generateClientId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setCart([]);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && cart.length > 0) {
        handleCheckout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  // Add to Cart
  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    toast.success(`Added ${product.name}`);
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    setCart(
      cart.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.qty,
    0
  );

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || checkoutLoading) return;

    if (paymentMethod === "CREDIT" && !selectedCustomerId) {
      toast.error("Select a customer for this credit sale");
      return;
    }

    setCheckoutLoading(true);

    const clientReferenceId = generateClientId();

    const payload = {
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.qty,
      })),
      paymentMethod,
      discount: 0,
      clientReferenceId,
      customerId: paymentMethod === "CREDIT" ? selectedCustomerId : null,
    };

    try {
      const res = await api.post("/sales", payload, { timeout: 8000 });

      setLastSale({
        ...res.data,
        items: cart,
        paymentMethod,
        pending: false,
      });

      setShowReceipt(true);
      setCart([]);
      setSelectedCustomerId("");
      toast.success(`Sale completed via ${paymentMethod}`);

      await fetchProducts();
    } catch (err) {
      console.error(err);

      if (!err.response) {
        // Offline — queue the sale (includes customerId for credit)
        addToQueue({
          clientReferenceId,
          payload,
        });

        // Optimistically reduce stock locally
        setProducts((prev) =>
          prev.map((p) => {
            const cartItem = cart.find((c) => c.id === p.id);
            if (!cartItem) return p;
            return { ...p, stockQuantity: p.stockQuantity - cartItem.qty };
          })
        );

        setLastSale({
          id: clientReferenceId,
          totalAmount: total,
          subtotal: total / 1.18,
          vatAmount: total - total / 1.18,
          items: cart,
          paymentMethod,
          pending: true,
          createdAt: new Date().toISOString(),
        });

        setShowReceipt(true);
        setCart([]);
        setSelectedCustomerId("");
        toast.success("You're offline — sale saved and will sync automatically");
      } else {
        toast.error(err.response?.data?.message || "Checkout failed");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
<div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
  <div className="flex items-center gap-4">
    <div className="bg-blue-600 p-3 rounded-xl">
      <ShoppingCart size={28} />
    </div>
    <div>
      <h1 className="text-2xl font-bold">Nova POS</h1>
      <p className="text-slate-400 text-sm">
        {user?.store?.name || "Demo Store"}
      </p>
    </div>
  </div>

  <div className="flex items-center gap-6">
    <div className="text-right">
      <p className="font-semibold">{user?.name}</p>
      <p className="text-xs text-slate-400">{user?.role}</p>
    </div>

    {hasPermission(user?.role, "dashboard") && (
      <button
        onClick={() => navigate("/admin")}
        className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
      >
        <LayoutDashboard size={18} />
        Admin
      </button>
    )}

    <button
      onClick={() => {
        logout();
        navigate("/login");
      }}
      className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
    >
      <LogOut size={18} />
      Logout
    </button>
  </div>
</div>

{/* Offline / Sync Banner — now outside the top bar */}
{(!isOnline || pendingCount > 0 || failedCount > 0) && (
  <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-sm shrink-0">
    <div className="flex items-center gap-4">
      {!isOnline && (
        <span className="flex items-center gap-2 text-amber-700 font-medium">
          <WifiOff size={16} /> Offline — sales are being queued
        </span>
      )}
      {pendingCount > 0 && (
        <span className="flex items-center gap-2 text-amber-700">
          <CloudUpload size={16} /> {pendingCount} sale(s) waiting to sync
        </span>
      )}
      {failedCount > 0 && (
        <span className="flex items-center gap-2 text-red-600 font-medium">
          <AlertCircle size={16} /> {failedCount} sale(s) need review
        </span>
      )}
    </div>

    {isOnline && (pendingCount > 0 || failedCount > 0) && (
      <button
        onClick={syncNow}
        className="text-amber-700 underline text-sm font-medium"
      >
        Sync now
      </button>
    )}
  </div>
)}

      {/* Daily Summary Bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-8">
          <div>
            <span className="text-slate-500">Today's Sales:</span>
            <span className="font-bold ml-2 text-green-600">UGX 245,000</span>
          </div>
          <div>
            <span className="text-slate-500">Transactions:</span>
            <span className="font-bold ml-2">12</span>
          </div>
        </div>
        <div className="text-slate-500 text-xs">
          {new Date().toLocaleDateString("en-UG", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Products Section */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow">
          <div className="p-6 border-b">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-4 top-4 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search product or scan barcode..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap"
              >
                Scan Barcode
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl p-5 rounded-2xl cursor-pointer transition-all active:scale-95"
                >
                  <div className="font-semibold text-lg leading-tight mb-2">
                    {product.name}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    UGX {product.sellingPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    Stock: {product.stockQuantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white rounded-3xl shadow flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <ShoppingCart /> Cart
            </h2>
          </div>

          <div className="flex-1 p-6 overflow-auto space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={60} />
                <p className="mt-4">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="border rounded-2xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        UGX {item.sellingPrice}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                        className="w-8 h-8 border rounded-lg hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="font-bold w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        className="w-8 h-8 border rounded-lg hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold">
                      UGX {(item.sellingPrice * item.qty).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Area */}
          <div className="p-6 border-t bg-slate-50 rounded-b-3xl">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-500">
                <span>VAT Included (18%)</span>
                <span>UGX {(total * 0.18).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold mt-2">
                <span>Total Due</span>
                <span>UGX {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-3">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                {["CASH", "MOBILE_MONEY", "CARD", "CREDIT"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-2xl text-sm font-medium transition ${
                      paymentMethod === method
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    {method === "MOBILE_MONEY" ? "Mobile Money" : method}
                  </button>
                ))}
              </div>

              {/* Customer picker — only when CREDIT is selected */}
              {paymentMethod === "CREDIT" && (
                <div className="mt-4">
                  <label className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                    <UserCircle size={16} /> Customer (required for credit)
                  </label>
                  <select
                    className="w-full p-4 border rounded-2xl bg-white"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.totalCredit > 0
                          ? ` (owes UGX ${Number(c.totalCredit).toLocaleString()})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                `COMPLETE SALE — UGX ${total.toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        sale={lastSale}
        onVoided={fetchProducts}
      />

      {showScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            const product = products.find((p) => p.barcode === barcode);
            if (product) {
              addToCart(product);
              toast.success(`Added ${product.name}`);
            } else {
              toast.error("Product not found for barcode");
            }
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}