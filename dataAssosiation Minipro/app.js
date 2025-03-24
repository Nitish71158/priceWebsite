const express=require("express");
const app=express();
const path=require("path");
const userModel=require("./models/user");
const postModel=require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken"); // used for sendinf the  token
const post = require("./models/post");

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index")
})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/");
})

//            (islogin)    middleware
app.get("/profile",islogin,async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email}).populate("posts");
    res.render("profile",{user});
})

app.get("/like/:id",islogin,async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id}).populate("user");
    if(post.like.indexOf(req.user.userid)===-1){
        post.like.push(req.user.userid);
    }else{
        post.like.splice(post.like.indexOf(req.user.userid),1);
    }
    await post.save();
    res.redirect("/profile");
})
app.get("/edit/:id",islogin,async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id}).populate("user");
    res.render("edit",{post})
})
app.post("/update/:id",islogin,async (req,res)=>{
    let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    res.redirect("/profile");
})
app.post("/post",islogin,async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
    let {content}=req.body;
    let post=await postModel.create({
        user:user._id,
        content:req.body.content,
    })
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})
app.post("/register",async (req,res)=>{
    let {email,password,name, username,age,date}=req.body;
    let user=await userModel.findOne({email:email});
    if(user){
        return res.status(300).send("user already exist");
    }

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt, async (err,hash)=>{
            let user =await userModel.create({
                username,
                email,
                age,
                name,   
                password:hash,
            });
            let token=jwt.sign({email:email,user:user._id},"shhh");
            res.cookie("token",token);
            res.redirect("/login");
        })
    })
})

app.post("/login",async (req,res)=>{
    let {email,password,username,date}=req.body;
    let user=await userModel.findOne({email:email});
    if(!user){
        return res.status(300).send("Plz Sign first ");
    }
    if (username !== user.username) {
        return res.status(400).send("Invalid username");
    }
    if (username !== user.date) {
        return res.status(400).send("Invalid Time");
    }
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            let token=jwt.sign({email:email,user:user._id},"shhh");
            res.cookie("token",token);
            res.status(200).redirect("https://www.smartprix.com");// profile
        }else{
            res.redirect("/login");
        }
    })
});
function islogin(req,res,next){ 
    if(req.cookies.token === "")return res.redirect("/login");
    else{
        let data=jwt.verify(req.cookies.token,"shhh");
        req.user=data;
        next();
    }
}

app.listen(3000);