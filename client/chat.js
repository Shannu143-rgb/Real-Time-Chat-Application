import { useEffect, useState } from "react";
import {io} from 'socket.io-client';
function Chat(){

    const [socket,setSocket]=useState(null);
    const [messages,setMessages]=useState({});
    const [message,setMessage]=useState([]);
    const[user]=useState(JSON.parse(localStorage.getItem('user:detail')));
    const [conversations,setconversations]=useState([])
   

    
    console.log('messages',messages);
   
    useEffect(()=>{
        setSocket(io('http://localhost:4000'))
    },[]);

    useEffect(()=>{
        socket?.emit('addUser')
        socket?.on('getUsers',users=>{
            console.log('activeusers:>>',users);
        })
        
        socket.on('getMessage',data=>{
        setMessages(prev=>[...prev,{user:data.users,message:data.message}]);
        })
    },[socket])

    
    useEffect(()=>{
        const loggedUser=JSON.parse(localStorage.getItem('user:detail'));
        const fetchConversations=async()=>{
            const res=await fetch(`http://localhost:9000/api/conversations/${loggedUser?.id}`,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json',
                },
            });
             const resData=await res.json();
             setconversations(resData)
        }
          fetchConversations()
    },[])


    const fetchMessages=async(conversationId,user)=>{
        const res=await fetch(`http://localhost:9000/api/message/${conversationId}`,{
            method:'GET',
            headers:{
                'Content-Type':'application/json',
            },
        });
        const resData=await res.json();
        console.log("resData:>>",resData);
        setMessages({messages:resData,receiver:user,conversationId})
    }

    const sendMessages=async(e)=>{
        socket?.emit('sendMessages',{
            senderId:user?.id,
            receiverId:messages?.receiver?.receiverId,
            message,
            conversationId:messages?.conversationId
        });
        const res=await fetch(`http://localhost:9000/api/message`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body:JSON.stringify({
                conversationId:messages?.conversationId,
                senderId:user?.id,
                message,
                receiverId:messages?.receiver?.receiverId
            })
        });
        setMessage('')
    }


    

    
    
    console.log('user:>>',user);
    console.log('conversations:>>',conversations);
    return(
        
        
        <div className="screen">
            <div className="users">
                <div className="profile">
                    <img src="/girl1.png" alt="profile"/>
                    <h3>{user?.name}</h3>
                </div>
                <hr/>
                <div>
                    <div className="msg">Messages</div>
                    <div>
                        {   
                            conversations.map(({conversationId,user})=>{
                                
                                return(
                                    <div onClick={()=>fetchMessages(conversationId,user)}>
                                
                                        <div className="profiles">
                                        <img src="/girl1.png" alt="profile"/>
                                        <h3>{user?.name}</h3>
                                        </div>
                                     </div>
        
                                )
                             })
                        }
                    </div>
                </div>
            </div>
            <div className="chat">
            {
                messages?.receiver?.name &&
                <div className="chat-box">
                        <img src="/girl1.png" alt="progile"/>
                        <h3>{ messages?.receiver?.name}</h3>
                </div>
            }
        
                <div className="scroll">
                    <div className="scroll_h">
                        <div className="msg-container">
                            {
                                messages?.messages?.length>0?
                                messages.messages.map(({message,user:{id}={}})=>{
                                    if(id===user?.id){
                                        return(
                                           <div className="msg-sender">{message}</div>
                                        )
                                    }
                                    else{
                                        return(
                                            <div className="msg-receiver">{message}</div>
                                        )
                                    }
                                }):<div style={{marginTop:"35%", paddingLeft:"40%"}}>No messages or No conversation selected</div>
                            } 
                        
                        </div>
                    </div>
                </div> 
                <div className="input-field">
                     <input placeholder="Type here...."  value={message} onChange={(e)=>setMessage(e.target.value)}className="input" />
                        
                        <div className="send" onClick={()=>{
                            sendMessages()}}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2">
                            <path d="M10 14l11 -11"></path>
                            <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"></path></svg>
                        </div>

                        <div className="doc" onClick={()=>sendMessages()}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="2">
                            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
                            <path d="M9 12h6"></path>
                            <path d="M12 9v6"></path> </svg>
                        </div>
                </div>
            </div>
        
        </div>

    )
}
export default Chat
