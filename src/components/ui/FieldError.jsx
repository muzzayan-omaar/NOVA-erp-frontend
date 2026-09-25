import { AlertCircle } from "lucide-react";

// Consistent error text under an input. Pair with the inputErrorClass
// helper below for the border/background treatment on the field itself.
export default function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
      <AlertCircle size={13} className="flex-shrink-0" />
      {message}
    </p>
  );
}

// Usage on any input:
// className={`w-full p-4 border rounded-2xl transition ${inputErrorClass(hasError)}`}
export const inputErrorClass = (hasError) =>
  hasError
    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
    : "border-slate-200 focus:border-nova-blue focus:ring-2 focus:ring-blue-100";