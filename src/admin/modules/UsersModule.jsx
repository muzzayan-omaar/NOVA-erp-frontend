import { useEffect, useState } from "react";
import api from "../../services/api";
import { UserPlus, User } from "lucide-react";
import toast from "react-hot-toast";

export default function UsersModule() {

  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);

  const [mode, setMode] = useState("list");
  const [selectedUser, setSelectedUser] = useState(null);


  const [form,setForm] = useState({
    name:"",
    email:"",
    password:"",
    role:"CASHIER",
    storeId:""
  });



  // LOAD USERS
  const fetchUsers = async()=>{
    try{

      const res = await api.get("/users");
      setUsers(res.data);

    }catch(err){

      console.error(err);
      toast.error("Failed to load users");

    }
  };



  // LOAD STORES
  const fetchStores = async()=>{

    try{

      const res = await api.get("/stores");
      setStores(res.data);


      // default first store
      if(res.data.length > 0){
        setForm(prev=>({
          ...prev,
          storeId:res.data[0].id
        }));
      }


    }catch(err){

      console.error(err);
      toast.error("Failed to load stores");

    }

  };



  useEffect(()=>{

    fetchUsers();
    fetchStores();

  },[]);




  // CREATE USER
  const createUser = async()=>{

    try{


      await api.post("/users",form);


      toast.success("Staff created");


      setForm({
        name:"",
        email:"",
        password:"",
        role:"CASHIER",
        storeId:stores[0]?.id || ""
      });


      setMode("list");

      fetchUsers();


    }catch(err){

      toast.error(
        err.response?.data?.message ||
        "Failed to create user"
      );

    }

  };





  // UPDATE USER
  const updateUser = async()=>{

    try{


      await api.patch(
        `/users/${selectedUser.id}`,
        {
          name:form.name,
          email:form.email,
          role:form.role
        }
      );


      toast.success("User updated");


      setMode("list");
      setSelectedUser(null);

      fetchUsers();


    }catch(err){

      toast.error("Failed to update user");

    }

  };





  // DELETE USER
  const deleteUser = async(id)=>{


    if(!confirm("Delete this user?"))
      return;


    try{

      await api.delete(`/users/${id}`);

      toast.success("User deleted");

      fetchUsers();


    }catch(err){

      toast.error("Failed to delete user");

    }

  };






return (

<div className="space-y-6">


<div className="flex justify-between items-center">

<h1 className="text-3xl font-bold flex items-center gap-3">

<User/>

Staff Management

</h1>


<button

onClick={()=>{
setMode("create");
setSelectedUser(null);
}}

className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex gap-2"

>

<UserPlus size={20}/>

Add Staff

</button>


</div>





<div className="grid grid-cols-12 gap-6">


{/* USERS LIST */}

<div className="col-span-5 bg-white rounded-3xl shadow p-6">


<h2 className="font-bold text-lg mb-4">
Team Members
</h2>


<div className="space-y-3">


{
users.map(u=>(

<div

key={u.id}

onClick={()=>{

setSelectedUser(u);

setForm({

name:u.name,

email:u.email,

password:"",

role:u.role,

storeId:u.storeId

});

setMode("edit");

}}

className="p-4 border rounded-2xl cursor-pointer hover:bg-slate-50"

>


<div className="flex justify-between">


<div>

<p className="font-semibold">
{u.name}
</p>


<p className="text-sm text-slate-500">
{u.email}
</p>


<p className="text-xs text-blue-600 mt-1">

🏢 {u.store?.name}

</p>


</div>



<span className="px-3 py-1 rounded-full bg-slate-100 text-xs">

{u.role}

</span>


</div>


</div>


))

}



</div>


</div>








{/* FORM */}


<div className="col-span-7 bg-white rounded-3xl shadow p-8">


{
mode==="list" && (

<div className="text-center text-slate-400">

Select staff member or add new

</div>

)

}



{
(mode==="create" || mode==="edit") && (


<div className="space-y-5">


<h2 className="text-2xl font-bold">

{
mode==="create"
?"Add Staff"
:"Edit Staff"
}

</h2>




<input

className="w-full p-4 border rounded-xl"

placeholder="Full Name"

value={form.name}

onChange={
e=>setForm({
...form,
name:e.target.value
})
}

/>





<input

className="w-full p-4 border rounded-xl"

placeholder="Email"

value={form.email}

onChange={
e=>setForm({
...form,
email:e.target.value
})
}

/>






{
mode==="create" &&

<input

type="password"

className="w-full p-4 border rounded-xl"

placeholder="Password"

value={form.password}

onChange={
e=>setForm({
...form,
password:e.target.value
})
}

/>

}







<select

className="w-full p-4 border rounded-xl"

value={form.role}

onChange={
e=>setForm({
...form,
role:e.target.value
})
}

>


<option value="CASHIER">
Cashier
</option>


<option value="MANAGER">
Manager
</option>


</select>







<select

className="w-full p-4 border rounded-xl"

value={form.storeId}

onChange={
e=>setForm({
...form,
storeId:e.target.value
})
}

>


<option>
Select Store
</option>


{
stores.map(store=>(

<option
key={store.id}
value={store.id}
>

{store.name}

</option>

))

}


</select>







<button

onClick={
mode==="create"
?createUser
:updateUser
}

className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold"

>


{
mode==="create"
?"Create User"
:"Save Changes"
}


</button>





{
mode==="edit" &&

<button

onClick={()=>deleteUser(selectedUser.id)}

className="w-full bg-red-600 text-white py-4 rounded-xl"

>

Delete User

</button>

}



</div>


)

}




</div>


</div>


</div>


);


}