import React,{useState} from 'react';
import {  useNavigate } from 'react-router-dom';
function Form(){
    const [formData,setData]=useState({
        name:"",
        email:"",
        password:"",
    });
    
    const [isSignUp,setSignUp]=useState(true);
    const [errors,seterrors]=useState({});
    const navigate=useNavigate();
    
    
    const handleChanges=(e)=>{setData((prevData)=>({ ...prevData,[e.target.name]:e.target.value}))};

        const handleSubmit=async (e)=>{
        e.preventDefault();
        console.log('data:>>',formData);
        
        const res=await fetch(`http://localhost:9000/api/${isSignUp? "register":"login"}`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body:JSON.stringify(formData),
            });
            if(res.status===400){
                alert("Invalid crendentials");
            }
            else{
                const resData=await res.json();
                console.log('data:>>',resData);
                if(resData.token){
                    localStorage.removeItem('user:token')
                    localStorage.removeItem('user:detail')

                    localStorage.setItem('user:token',resData.token)
                    localStorage.setItem('user:detail',JSON.stringify(resData.user))
                    navigate('/chat');
                }
            }
        
        let newErrors={};
        
        if(!formData.name.trim()){
           newErrors.name="Full name is required.";
        }

        if(!formData.email.trim()){
            newErrors.email="Email is required.";
        }
        else if(!/^\S+@\S+\.\S+$/.test(formData.email)){
            newErrors.email="Email is not valid.";
        }
        
        if(!formData.password.trim()){
            newErrors.password="Password is required.";
        }
        else if(formData.password.length<8){
           newErrors.password="Password must be atleast 8 characters.";
        }
        
        seterrors(newErrors);

        if(Object.keys(newErrors).length===0){
            console.log("Submitted");
            navigate("/chat");
        }
    }
            
    return(
        <div className="login-page">
            <div className="login-box">
                
                <h2>{isSignUp?"Sign Up":"Sign In"}</h2>
                <form onSubmit={handleSubmit}>
                    {isSignUp&&(
                    <>
                        <label>Full Name</label>
                        <input type="text" name="name"placeholder="Enter your full name"  value={formData.name} 
                        onChange={handleChanges}/>
                        {errors.name&&<p style={{color:'red',fontFamily:"serief",marginTop:"5px",marginBottom:"10px"}}>{errors.name}</p>}
                    </>
                    )}
                    <label>Email</label>
                    <input type="text" name="email" placeholder="Enter your email" value={formData.email}
                     onChange={handleChanges}/>
                     {errors.email&&<p style={{color:'red',fontFamily:"serief",marginTop:"5px",marginBottom:"10px"}}>{errors.email}</p>} 

                    <label>Password</label>
                    <input type="password" name="password" placeholder="Enter your password" value={formData.password} 
                    onChange={handleChanges}/>
                     {errors.password&&<p style={{color:'red',fontFamily:"serief",marginTop:"5px",marginBottom:"10px"}}>{errors.password}</p>} 
                    
                    <button type="submit">{isSignUp?"Sign Up":"Sign In"}</button>
                </form>
                   
                    <div className='toggle'>
                        {isSignUp?(
                            <p>
                                Already have an account?{""}
                                <span onClick={()=>setSignUp(false)} className='toggle-link'>Sign In</span>
                            </p>
                        ):(
                            <p>
                                Don't have an account?{""}
                                <span onClick={()=>setSignUp(true)} className='toggle-link'>Sign Up</span>
                            </p>
                        )}
                    </div>
    
        </div>
    </div>
    );
}
export default Form
