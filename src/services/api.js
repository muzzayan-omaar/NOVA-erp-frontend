import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use(config=>{

    const {token,user}=useAuthStore.getState();

    if(token){

        config.headers.Authorization=`Bearer ${token}`;

    }

    if(user?.activeStoreId||user?.storeId){

        config.headers["x-store-id"]=
        user.activeStoreId||user.storeId;

    }

    return config;

});

api.interceptors.response.use(

    response=>response,

    error=>{

        if(error.response?.status===401){

            const {logout}=useAuthStore.getState();

            logout();

            window.location.href="/login";

        }

        return Promise.reject(error);

    }

);

export default api;