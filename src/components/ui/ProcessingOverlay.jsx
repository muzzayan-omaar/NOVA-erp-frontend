import Spinner from "./Spinner";

// A deliberately blocking, full-screen "something is happening" state —
// for the specific moments a non-technical user is most likely to get
// anxious: checkout, syncing, submitting something that touches real
// stock or money. Not meant for every form save; a disabled button with
// "Saving..." text is enough for those.
export default function ProcessingOverlay({ message = "Processing..." }) {
  return (
    <div className="fixed inset-0 bg-nova-950/60 backdrop-blur-sm flex items-center justify-center z-[200]">
      <div className="bg-white rounded-3xl shadow-nova px-10 py-8 flex flex-col items-center gap-4">
        <Spinner size={40} />
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
}