const mongoose=require("mongoose");

const postSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    date:{
        type:Date,
        Default:Date.now
     },
    content:String ,
    like:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
    ]
});
module.exports=mongoose.model("post",postSchema);