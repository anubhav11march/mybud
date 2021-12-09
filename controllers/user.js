const User=require('../models/usermodel');
const {generateToken,hashPassword,successmessage,errormessage,verifypassword}=require('../utils/util');


exports.UserSignUp=async(req,res)=>{
    try{
        let {username,password,email,phoneno}=req.body;
        if(!username||!password||!email||!phoneno){
            return res.status(400).json(errormessage("All fields must be present"));
        }

        username=username.trim();
        password=password.trim();
        email=email.trim();
        phoneno=phoneno.trim();

        //checking if email exists already
        let ismatch=await User.findOne({email})
        if(ismatch){
            return res.status(400).json(errormessage("Email already registered! Try with some other email!"))
        }
        
        // checking valid phone no.
        let reg="(?:(?:\\+|0{0,2})91(\\s*[\\-]\\s*)?|[0]?)?[789]\\d{9}";
        let phonereg= new RegExp(reg);
        
        if(!phonereg.test(phoneno)===null){
            return res.status(400).json(errormessage("Enter valid Phone Number"));
        }

        //hashing the password
        let hashedpassword=hashPassword(password);

        let user=new User({
            username,
            password:hashedpassword,
            email,
            phoneno
        });

        //generating token
        const token=generateToken( JSON.stringify(user._id) );

        await user.save();
        res.status(200).json(successmessage("User Created!",token));

    }catch(err){
        res.status(400).json(errormessage(err.message))
    }
}

exports.LoginUser=async (req,res)=>{
    try{
        console.log(req.headers);
        let {username,password}=req.body;

        username=username.trim();
        password=password.trim();

        // check whether email exists or not
        let user=await User.findOne({username});
        if(!user){
            return res.status(400).json(errormessage("Email or password incorrect!"));
        }

        if(!verifypassword(password,user.password)){
            return res.status(400).json(errormessage("Email or password incorrect!"));
        }

        let token=generateToken( JSON.stringify(user._id));

        res.status(200).json(successmessage("Logged In Successfuly!",token));

    }catch(err){
        res.status(400).json(errormessage(err.message));
    }
}