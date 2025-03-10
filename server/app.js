const express=require("express");
const bcryptjs=require("bcryptjs");
const jwt=require("jsonwebtoken");
const cors=require('cors');
const io=require('socket.io')(4000,{
    cors:{
        origin:'http://localhost:3000',
    }
});

require('./db/connection');

const Users=require('./models/Users');
const Conversations=require('./models/Conversations');
const Messages = require("./models/Messages");


const port=process.env.PORT||9000;
 
let users=[]
 io.on('connection',socket=>{
    console.log('User connected',socket.id);
    socket.on('addUser',userId=>{
        const isUserExist=users.find(user=>user.userId===userId);
        if(!isUserExist){
            const user={userId,socketId:socket.id};
            users.push(user);
            io.emit('getUsers',users);
        }
    });

    socket.on('sendMessages',async({senderId,receiverId,message,conversationId})=>{
        const receiver=users.find(user=>user.userId===receiverId);
        const sender=users.find(user=>user.userId===senderId);
         const user=await Users.findById(senderId);
        if(receiver){
            io.to(receiver.socketId).to(sender.socketId).emit('getMessage',{
                senderId,
                message,
                conversationId,
                receiverId,
                user:{id:user._id,name:user.name,email:user.email}
            });
        }
    });
    
    socket.on('disconnect',()=>{
        users=users.filter(user=>user.socketId!==socket.id);
        io.emit('getUsers',users);
    });
  });

const app=express();
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cors());

app.get('/',(req,res)=>{
    res.send("Welcome to Localhost");
    
})

app.post('/api/register',async(req,res,next)=>{
    try{
        const{name,email,password}=req.body;
        if(!name||!email||!password){
            res.status(400).json({error:"Please fill all required fields"});
        }

        else{
            const isAlreadyExist=await Users.findOne({email})
            if(isAlreadyExist){
                res.status(400).json({message:"User already exists"});
            }
            else{
                const newUser=new Users({name,email});
                bcryptjs.hash(password,8,(err,hashedPassword)=>{
                    newUser.set('password',hashedPassword);
                    newUser.save();
                    next();
                });
                return res.status(200).json("User registered successfully");
            }

        }
    }

    catch(error){
        console.log(error,'Error');
    }
})

app.post("/api/login",async (req,res,next)=>{
    try{
        const{email,password}=req.body;
        if(!email||!password){
            res.status(400).json({error:"Please fill all required fields"})
        }
        else{
            const user=await Users.findOne({email});
            if(!user){
                res.status(400).json({error:"User email or password incorrect"});
            }
            else{
                const validateUser=await bcryptjs.compare(password,user.password);
                if(!validateUser){
                    res.status(400).json({error:"User email or password incorrect"});
                }
                else{
                    const payload={
                        userId:user._id,
                        email:user.email
                    }
                    const JWT_SECRET_KEY=process.env.JWT_SECRET_KEY||'THIS_IS _A_JWT_SECRET_KEY';
                    jwt.sign(payload,JWT_SECRET_KEY,{expiresIn:84600},async(err,token)=>{
                        await Users.updateOne({_id:user._id},{
                            $set:{token}
                        })
                        user.save();
                        return res.status(200).json({user:{id:user._id,email:user.email,name:user.name},token:token})
                    })
                }
            }
            
        }
    }
    catch(error){
        console.log(error,'Error');

    }
})
app.post('/api/conversations',async(req,res)=>{
    try {
        const {senderId,receiverId}=req.body;
        const newConversation=new Conversations({members:[senderId,receiverId]});
        await newConversation.save();
        res.status(200).send("Conversation created successfully");
    } catch (error) {
        console.log(error,'Error');
    }
})


app.get('/api/conversations/:userId',async(req,res)=>{
    try{
        const userId=req.params.userId;
        const conversations=await Conversations.find({members:{$in:[userId]}});
        const conversationUserData=Promise.all(conversations.map(async(conversation)=>{
            const receiverId=conversation.members.find((member)=>member!==userId);
            const user= await Users.findById(receiverId);
             return{user:{receiverId:user._id,email:user.email,name:user.name},conversationId:conversation._id}
        }))
        res.status(200).json(await conversationUserData);
    }
    catch(error){
        console.log(error,'Error');
    }
})


app.post('/api/message',async(req,res)=>{
    try {
        const {conversationId,senderId,message,receiverId=''}=req.body;
         if(!senderId||!message)return res.status(400).send('Please fill all required fields')
        if(!conversationId && receiverId){
            const newConversation=new Conversations({members:[senderId,receiverId]});
            await newConversation.save();
            const newMessages=new Messages({conversationId:newConversation._id,senderId,message});
            await newMessages.save();
            return res.status(200).send("Message sent successfully");
        }
        else if(!conversationId && !receiverId){
            return res.status(400).send('Please fill all required fields')
        }
        const newMessages=new Messages({conversationId,senderId,message});
        await newMessages.save();
        res.status(200).send("Message sent succssfully");
    }
    catch (error) {
        console.log(error,'Error');
    }
});

app.get('/api/message/:conversationId',async(req,res)=>{
    try {
        const conversationId=req.params.conversationId;
         if(conversationId==='new')return res.status(200).json([])
        const messages=await Messages.find({conversationId});
        const messageUserData=Promise.all(messages.map(async(message)=>{
            const user=await Users.findById(message.senderId);
            return{user:{id:user._id,email:user.email,name:user.name},message:message.message}
        }));
        res.status(200).json(await messageUserData );
    } catch (error) {
        console.log(error,'Error');
    }
})


app.get('/api/users',async(req,res)=>{
    try{
        const users=await Users.find();
        const usersData=Promise.all(users.map(async(user)=>{
            return{user:{email:user.email,name:user.name},userId:user._id}
        }))
        res.status(200).json(await usersData);
    }
    catch(error){
        console.log(error,'Error');
    }
})

app.listen(port,()=>{
    console.log("listening on port:",+port);
})
