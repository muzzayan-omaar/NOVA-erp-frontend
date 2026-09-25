import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import { ShoppingCart, LogOut, Search, X, Loader2, LayoutDashboard, WifiOff, CloudUpload, AlertCircle, UserCircle, Plus, Trash2, Hash } from "lucide-react";
import toast from "react-hot-toast";
import ReceiptModal from "../components/pos/ReceiptModal";
import BarcodeScanner from "../components/pos/BarcodeScanner";
import SerialPickerModal from "../components/pos/SerialPickerModal";
import UnitPickerModal from "../components/pos/UnitPickerModal";
import useOfflineSalesSync from "../hooks/useOfflineSalesSync";
import { addToQueue } from "../utils/offlineQueue";
import { hasPermission } from "../utils/hasPermission";

const PAYMENT_METHODS = ["CASH", "MOBILE_MONEY", "CARD", "CREDIT", "BANK_TRANSFER"];

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

  const [splitMode, setSplitMode] = useState(false);
  const [splitLines, setSplitLines] = useState([]);
  const [splitDraft, setSplitDraft] = useState({ method: "CASH", amount: "", reference: "" });

  // Multi-UOM / serial picker state
  const [pickerProduct, setPickerProduct] = useState(null);
  const [pickerType, setPickerType] = useState(null); // "unit" | "serial" | null
  // Same-session guard: once a serial is used (in cart OR already queued
  // offline), it isn't offered again until the app reloads/syncs — this
  // protects a single device, not multiple devices offline simultaneously.
  const [reservedSerialIds, setReservedSerialIds] = useState([]);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isOnline, pendingCount, failedCount, syncNow } = useOfflineSalesSync();

  useEffect(() => {
    fetchProducts();
    api.get("/customers").then((res) => setCustomers(res.data)).catch(() => {});
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, splitMode, splitLines, paymentMethod, selectedCustomerId]);

  /* ---------- Adding to cart: base unit, chosen unit, or a specific serial ---------- */

  const handleProductClick = (product) => {
    if (product.isSerialized) {
      setPickerProduct(product);
      setPickerType("serial");
    } else if (product.hasUnits) {
      setPickerProduct(product);
      setPickerType("unit");
    } else {
      addSimpleBaseUnit(product);
    }
  };

  const addSimpleBaseUnit = (product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.id && !item.productUnitId && !item.productSerialId
      );
      if (existing) {
        return prev.map((item) =>
          item.cartLineId === existing.cartLineId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartLineId: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          unitLabel: product.unitType || "Piece",
          unitPrice: product.sellingPrice,
          qty: 1,
          productUnitId: null,
          productSerialId: null,
          serialNumber: null,
          conversionFactor: 1,
        },
      ];
    });
    toast.success(`Added ${product.name}`);
  };

  const addUnitLine = (line) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === line.productId && item.productUnitId === line.productUnitId
      );
      if (existing) {
        return prev.map((item) =>
          item.cartLineId === existing.cartLineId ? { ...item, qty: item.qty + line.qty } : item
        );
      }
      return [...prev, line];
    });
    toast.success(`Added ${line.name} (${line.unitLabel})`);
  };

  const addSerialLine = (line) => {
    setCart((prev) => [...prev, line]);
    setReservedSerialIds((prev) => [...prev, line.productSerialId]);
    toast.success(`Added ${line.name} — SN: ${line.serialNumber}`);
  };

  const removeFromCart = (cartLineId) => {
    const line = cart.find((c) => c.cartLineId === cartLineId);
    if (line?.productSerialId) {
      setReservedSerialIds((prev) => prev.filter((id) => id !== line.productSerialId));
    }
    setCart(cart.filter((item) => item.cartLineId !== cartLineId));
  };

  const updateQuantity = (cartLineId, newQty) => {
    if (newQty < 1) return;
    setCart(cart.map((item) => (item.cartLineId === cartLineId ? { ...item, qty: newQty } : item)));
  };

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  const generateClientId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  /* ---------- Split payment helpers ---------- */

  const splitAssigned = splitLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const splitRemaining = total - splitAssigned;
  const splitHasCredit = splitLines.some((l) => l.method === "CREDIT");

  const addSplitLine = () => {
    const amt = Number(splitDraft.amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount for this payment line");
      return;
    }
    if (amt > splitRemaining + 0.01) {
      toast.error("That amount is more than what's left to cover");
      return;
    }
    setSplitLines([...splitLines, { ...splitDraft, amount: amt }]);
    setSplitDraft({ method: "CASH", amount: "", reference: "" });
  };

  const removeSplitLine = (index) => {
    setSplitLines(splitLines.filter((_, i) => i !== index));
  };

  const toggleSplitMode = () => {
    setSplitMode(!splitMode);
    setSplitLines([]);
    setSplitDraft({ method: "CASH", amount: "", reference: "" });
  };

  /* ---------- Checkout ---------- */

  const handleCheckout = async () => {
    if (cart.length === 0 || checkoutLoading) return;

    if (splitMode) {
      if (splitLines.length === 0) {
        toast.error("Add at least one payment line");
        return;
      }
      if (Math.abs(splitRemaining) > 1) {
        toast.error(`Payment lines don't add up to the total (UGX ${splitRemaining.toLocaleString()} remaining)`);
        return;
      }
      if (splitHasCredit && !selectedCustomerId) {
        toast.error("Select a customer for the credit portion of this sale");
        return;
      }
    } else if (paymentMethod === "CREDIT" && !selectedCustomerId) {
      toast.error("Select a customer for this credit sale");
      return;
    }

    setCheckoutLoading(true);

    const clientReferenceId = generateClientId();

    const payload = {
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.qty,
        productUnitId: item.productUnitId,
        productSerialId: item.productSerialId,
      })),
      discount: 0,
      clientReferenceId,
      customerId: splitMode
        ? (splitHasCredit ? selectedCustomerId : null)
        : (paymentMethod === "CREDIT" ? selectedCustomerId : null),
      ...(splitMode
        ? { payments: splitLines.map((l) => ({ method: l.method, amount: Number(l.amount), reference: l.reference || undefined })) }
        : { paymentMethod }),
    };

    const displayMethod = splitMode ? "Split Payment" : paymentMethod;

    try {
      const res = await api.post("/sales", payload, { timeout: 8000 });

      setLastSale({
        ...res.data,
        items: cart.map((c) => ({ name: `${c.name} (${c.unitLabel})`, qty: c.qty, sellingPrice: c.unitPrice })),
        paymentMethod: displayMethod,
        pending: false,
      });

      setShowReceipt(true);
      setCart([]);
      setSelectedCustomerId("");
      setSplitLines([]);
      toast.success(`Sale completed via ${displayMethod}`);

      await fetchProducts();
    } catch (err) {
      console.error(err);

      if (!err.response) {
        addToQueue({ clientReferenceId, payload });

        // Optimistic local stock adjustment, in real base-unit terms
        setProducts((prev) =>
          prev.map((p) => {
            const cartLinesForProduct = cart.filter((c) => c.productId === p.id);
            if (cartLinesForProduct.length === 0) return p;
            const baseUnitsUsed = cartLinesForProduct.reduce(
              (sum, c) => sum + c.qty * (c.conversionFactor || 1),
              0
            );
            return { ...p, stockQuantity: p.stockQuantity - baseUnitsUsed };
          })
        );

        // Serials used in a queued offline sale stay reserved for this
        // device until sync — see the note at the top of this file.
        cart.forEach((c) => {
          if (c.productSerialId) {
            setReservedSerialIds((prev) => (prev.includes(c.productSerialId) ? prev : [...prev, c.productSerialId]));
          }
        });

        setLastSale({
          id: clientReferenceId,
          totalAmount: total,
          subtotal: total / 1.18,
          vatAmount: total - total / 1.18,
          items: cart.map((c) => ({ name: `${c.name} (${c.unitLabel})`, qty: c.qty, sellingPrice: c.unitPrice })),
          paymentMethod: displayMethod,
          pending: true,
          createdAt: new Date().toISOString(),
        });

        setShowReceipt(true);
        setCart([]);
        setSelectedCustomerId("");
        setSplitLines([]);
        toast.success("You're offline — sale saved and will sync automatically");
      } else {
        toast.error(err.response?.data?.message || "Checkout failed");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  /* ---------- Barcode / scan resolution ---------- */

  const handleScan = async (code) => {
    setShowScanner(false);

    try {
      const res = await api.get("/products/resolve-scan", { params: { code } });
      const { type, product, productUnit, serial } = res.data;

      if (type === "SERIAL") {
        if (reservedSerialIds.includes(serial.id) || cart.some((c) => c.productSerialId === serial.id)) {
          toast.error("That serial is already in your cart");
          return;
        }
        addSerialLine({
          cartLineId: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          unitLabel: product.unitType || "Piece",
          unitPrice: product.sellingPrice,
          qty: 1,
          productUnitId: null,
          productSerialId: serial.id,
          serialNumber: serial.serialNumber,
          conversionFactor: 1,
        });
      } else if (type === "UNIT") {
        const unitPrice = productUnit.sellingPrice ?? product.sellingPrice * productUnit.conversionFactor;
        addUnitLine({
          cartLineId: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          unitLabel: productUnit.unitName,
          unitPrice,
          qty: 1,
          productUnitId: productUnit.id,
          productSerialId: null,
          serialNumber: null,
          conversionFactor: productUnit.conversionFactor,
        });
      } else if (type === "BASE") {
        addSimpleBaseUnit(product);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Product not found for this code");
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
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl">
            <ShoppingCart size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nova POS</h1>
            <p className="text-slate-400 text-sm">{user?.store?.name || "Demo Store"}</p>
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
              <LayoutDashboard size={18} /> Admin
            </button>
          )}

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Daily Summary Bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between text-sm">
        <div className="text-slate-500 text-xs">
          {new Date().toLocaleDateString('en-UG', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Offline / Sync Status Bar */}
      {(!isOnline || pendingCount > 0 || failedCount > 0) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-sm">
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
            <button onClick={syncNow} className="text-amber-700 underline text-sm font-medium">
              Sync now
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Products Section */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow">
          <div className="p-6 border-b">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-4 text-slate-400" size={20} />
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
                  onClick={() => handleProductClick(product)}
                  className="bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl p-5 rounded-2xl cursor-pointer transition-all active:scale-95"
                >
                  <div className="font-semibold text-lg leading-tight mb-2 flex items-center gap-2">
                    {product.name}
                    {product.isSerialized && <Hash size={14} className="text-blue-500" />}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    UGX {product.sellingPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    Stock: {product.stockQuantity} {product.unitType || ""}
                    {product.hasUnits && <span className="text-blue-500 ml-1">· multiple units</span>}
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
                <div key={item.cartLineId} className="border rounded-2xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.unitLabel} — UGX {item.unitPrice.toLocaleString()}
                      </p>
                      {item.serialNumber && (
                        <p className="text-xs text-blue-600 font-mono mt-1">SN: {item.serialNumber}</p>
                      )}
                    </div>
                    <button onClick={() => removeFromCart(item.cartLineId)} className="text-red-500">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {item.productSerialId ? (
                      <span className="text-xs text-slate-400">Quantity fixed at 1 (serialized item)</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.cartLineId, item.qty - 1)} className="w-8 h-8 border rounded-lg hover:bg-slate-100">-</button>
                        <span className="font-bold w-10 text-center">{item.qty}</span>
                        <button onClick={() => updateQuantity(item.cartLineId, item.qty + 1)} className="w-8 h-8 border rounded-lg hover:bg-slate-100">+</button>
                      </div>
                    )}
                    <p className="font-bold">UGX {(item.unitPrice * item.qty).toLocaleString()}</p>
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

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => splitMode && toggleSplitMode()}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${!splitMode ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}
              >
                Single Payment
              </button>
              <button
                onClick={() => !splitMode && toggleSplitMode()}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${splitMode ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}
              >
                Split Payment
              </button>
            </div>

            {!splitMode ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-slate-500 mb-3">Payment Method</p>
                  <div className="grid grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 rounded-2xl text-sm font-medium transition ${
                          paymentMethod === method
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200"
                        }`}
                      >
                        {method === "MOBILE_MONEY" ? "Mobile Money" : method === "BANK_TRANSFER" ? "Bank Transfer" : method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "CREDIT" && (
                  <div className="mb-6">
                    <label className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                      <UserCircle size={16} /> Customer (required for credit)
                    </label>
                    <select
                      className="w-full p-4 border rounded-2xl"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.totalCredit > 0 ? `(owes UGX ${Number(c.totalCredit).toLocaleString()})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div className="mb-6 space-y-3">
                {splitLines.length > 0 && (
                  <div className="space-y-2">
                    {splitLines.map((l, i) => (
                      <div key={i} className="flex justify-between items-center bg-white border rounded-xl p-3 text-sm">
                        <span>{l.method === "MOBILE_MONEY" ? "Mobile Money" : l.method}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">UGX {Number(l.amount).toLocaleString()}</span>
                          <button onClick={() => removeSplitLine(i)} className="text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <select
                    className="p-3 border rounded-xl text-sm flex-1"
                    value={splitDraft.method}
                    onChange={(e) => setSplitDraft({ ...splitDraft, method: e.target.value })}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m === "MOBILE_MONEY" ? "Mobile Money" : m === "BANK_TRANSFER" ? "Bank Transfer" : m}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    className="p-3 border rounded-xl text-sm w-28"
                    value={splitDraft.amount}
                    onChange={(e) => setSplitDraft({ ...splitDraft, amount: e.target.value })}
                  />
                  <button onClick={addSplitLine} className="bg-slate-900 text-white px-3 rounded-xl">
                    <Plus size={18} />
                  </button>
                </div>

                <div className={`flex justify-between text-sm font-medium px-1 ${Math.abs(splitRemaining) < 1 ? "text-green-600" : "text-amber-600"}`}>
                  <span>Remaining to assign</span>
                  <span>UGX {splitRemaining.toLocaleString()}</span>
                </div>

                {splitHasCredit && (
                  <div>
                    <label className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                      <UserCircle size={16} /> Customer (required for the credit portion)
                    </label>
                    <select
                      className="w-full p-4 border rounded-2xl"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

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
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {pickerType === "unit" && pickerProduct && (
        <UnitPickerModal
          product={pickerProduct}
          onClose={() => { setPickerProduct(null); setPickerType(null); }}
          onAdd={addUnitLine}
        />
      )}

      {pickerType === "serial" && pickerProduct && (
        <SerialPickerModal
          product={pickerProduct}
          alreadyInCart={reservedSerialIds}
          onClose={() => { setPickerProduct(null); setPickerType(null); }}
          onAdd={addSerialLine}
        />
      )}
    </div>
  );
}