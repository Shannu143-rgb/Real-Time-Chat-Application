const mongoose=require("mongoose");
const url="mongodb+srv://shannushaik305:Shannu143@cluster0.nlbdy.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(url,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
.then(()=>console.log("Connected to DB"))
.catch((e)=>console.log("Error",e))
