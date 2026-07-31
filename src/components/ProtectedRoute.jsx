import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import hasPermission from "../utils/hasPermission";


export default function ProtectedRoute({permission}) {

    const { user } = useAuthStore();


    if(!user){
        return <Navigate to="/login" replace />;
    }


    if(permission && !hasPermission(
        user.role,
        permission
    )){

        return (
            <Navigate 
                to="/admin/unauthorized"
                replace
            />
        );

    }


    return <Outlet />;

}