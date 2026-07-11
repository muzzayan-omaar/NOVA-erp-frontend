import toast from "react-hot-toast";

export default function StoreSwitcher({
  stores,
  currentStore,
  onSwitch,
  switchingStore,
}) {
  return (
    <div className="w-full px-4 py-3">

      {/* Current Store Display */}
      <div className="mb-3">
        <p className="text-xs uppercase text-slate-400">
          Current Store
        </p>

        <div className="text-white font-semibold flex items-center gap-2">
          {currentStore?.isHeadOffice ? "🏢" : "📍"}

          {currentStore?.name || "No store selected"}
        </div>

        {currentStore?.isHeadOffice && (
          <p className="text-xs text-blue-400">
            Head Office
          </p>
        )}
      </div>


      {/* Store Selector */}
      <select
        value={currentStore?.id || ""}
        onChange={onSwitch}
        disabled={switchingStore}
        className="
          w-full 
          p-3
          rounded-xl
          bg-slate-800
          text-white
          border
          border-slate-700
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      >

        <option value="" disabled>
          Choose store
        </option>


        {stores.length === 0 && (
          <option disabled>
            No stores available
          </option>
        )}


        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.isHeadOffice
              ? `🏢 ${store.name} (HQ)`
              : `📍 ${store.name}`}
          </option>
        ))}

      </select>


      {switchingStore && (
        <p className="text-xs text-blue-400 mt-2">
          Switching store...
        </p>
      )}

    </div>
  );
}