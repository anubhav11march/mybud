const {challenges,successmessage,errormessage, todayDate }=require('../utils/util');
const User=require('../models/usermodel');
const ChallengeList = require('../models/challengeList')
const Challenge=require('../models/challenges');
const mongoose=require('mongoose');

exports.getChallenges=(req,res)=>{
    let data = await ChallengeList.find();
    res.status(200).json(successmessage("All Challenges", data));
}

exports.takeChallenge=async(req,res)=>{
    try{
        let {challenge,days}=req.body;
        if(!challenge||!days){
            return res.status(400).json(errormessage("All fields not present!"));
        }

        let {user}=req;
        console.log(user);
        user=mongoose.Types.ObjectId( JSON.parse(user)) ;
        days=parseInt(days);
        let user_challenge=await Challenge.findOne({name:challenge,userid:user,isCompleted:false}); //checking if user has already taken part in this challenge and not yet finished
        if(user_challenge){
            return res.status(400).json(errormessage("You have already taken this challenge and not yet finished it!"))
        }

        let ismatch=await Challenge.find({userid:user,isCompleted:false});
        if(ismatch.length>=3){
            return res.status(400).json(errormessage("Already Enrolled in 3 Challenges!"));
        }

        let date=new Date();
        date.setDate(date.getDate()+days);

        user_challenge=new Challenge({
            name:challenge,
            days,
            userid:user,
            isCompleted:false,
            counter:[],
            createdDate:todayDate(),
            finalDate: todayDate(date)
        });

        await user_challenge.save();
        res.status(200).json(successmessage('Successfuly enrolled in the Challenge!',user_challenge));
    }catch(err){
        res.status(400).json(errormessage(err.message));
    }
}

exports.dailyattendence=async(req,res)=>{
    try{
        let {challenge}=req.body;
        if(!challenge){
            return res.status(400).json(errormessage("ALl fields should be present!"));
        }
        let {user}=req;

        user=mongoose.Types.ObjectId( JSON.parse(user));
        let isMatch=await Challenge.findOne({name:challenge,userid:user,isCompleted:true});
        if(isMatch){
            return res.status(400).json(errormessage("You have already completed the challenge!"));
        }
        isMatch=await Challenge.findOne({name:challenge,userid:user,counter:{$in:[todayDate()]}});
        if(isMatch){
            return res.status(400).json(errormessage("You have already marked the attendence for today!"));
        }

        let updates={
            $push:{
                counter: todayDate()
            }
        }
        let updatedchallenge=await Challenge.findOneAndUpdate({name:challenge,userid:user},updates,{new:true});
        if(!updatedchallenge){
            return res.status(400).json(errormessage("Something Went Wrong!"));
        }

        res.status(200).json(successmessage("Successfuly Updated!",updatedchallenge));

    }catch(err){
        res.status(400).json(errormessage(err.message))
    } 
}

exports.getUserchallenges=async(req,res)=>{
    try{
        let {user}=req;
        const userchallenges=await Challenge.find({userid: mongoose.Types.ObjectId(JSON.parse(user))});
        res.status(200).json(successmessage("User Challenges",userchallenges));

    }catch(err){
        res.status(400).json(errormessage(err.message));
    }
}

exports.getAttendence=async(req,res)=>{
    try{
        let {name}=req.body;
        let {user}=req;
        user=mongoose.Types.ObjectId( JSON.parse(user));

        if(!name){
            return res.status(400).json("Provide Challenge Name!");
        }

        let challenge=await Challenge.findOne({name,userid:user});
        if(!challenge){
            return res.status(200).json(successmessage("No data found with this user"));
        }
        res.status(200).json(successmessage("Challenge Attendence",challenge.counter));

    }catch(err){
        res.status(200).json(errormessage(err.message));
    }
}

exports.deleteChallenge=async(req,res)=>{
    try{
        let {challengeid}=req.query;
        if(!challengeid){
            return res.status(400).json(errormessage("Challenge id not provided!"));
        }

        challengeid=mongoose.Types.ObjectId(challengeid);
        let deletedchallenge=await Challenge.findOneAndDelete({_id:challengeid});
        if(!deletedchallenge){
            return res.status(400).json(errormessage("Failed to delete!"));
        }

        res.status(200).json(successmessage("Successfuly Deleted!",deletedchallenge));


    }catch(err){
        res.status(400).json(errormessage(err.message));
    }
}