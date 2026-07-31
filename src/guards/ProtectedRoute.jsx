import { Navigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { hasPermission } from "../utils/hasPermission";


export default function ProtectedRoute({
  children,
  permission
}) {

  const { user } = useAuthStore();


  // No user
  if (!user) {
    return <Navigate to="/login" replace />;
  }


  // Permission denied
  if(permission && !hasPermission(user.role, permission)){
    return (
      <div className="
      h-full
      flex
      items-center
      justify-center
      ">
        <div className="
        bg-white
        p-10
        rounded-3xl
        shadow
        text-center
        ">

          <h1 className="text-3xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="text-slate-500 mt-3">
            You don't have permission to access this module.
          </p>

        </div>
      </div>
    );
  }


  return children;

}