const cron = require('node-cron');
const Challenges = require('../models/challenges');
const Chats = require('../models/chat');
const Match = require('../models/match');
const { todayDate } = require('./util');

// cron.schedule(
//     '58 23 * * *',
//     hello
// );

// cron.schedule(
//     '57 23 * * *',
//     checkcompletedChallenges
// );

async function hello() {
    let challenges = await Challenges.find({ isCompleted: false });
    let filtered_array = challenges.filter((challenge) => {
        let flag = 0;
        let sorted_array = challenge.counter.sort((a, b) => new Date(a) - new Date(b));
        if (sorted_array.length > 1) {
            for (var i = 0; i < sorted_array.length - 1; i++) {
                console.log((new Date(sorted_array[i + 1]).getTime() - new Date(sorted_array[i]).getTime()) / (24 * 3600 * 1000))
                if (((new Date(sorted_array[i + 1]).getTime() - new Date(sorted_array[i]).getTime()) / (24 * 3600 * 1000)) >= 3) {
                    flag = 1;
                }
            }
        }
        if (flag) {
            return challenge
        }
    })
    filtered_array.map(async arr => {
        let updates = {
            $set: {
                createdDate: todayDate()
            }
        }
        await Challenges.findOneAndUpdate({ _id: arr._id }, updates);
    })

}

const checkcompletedChallenges = async () => {
    let results = await Challenges.updateMany({ isCompleted: false, finalDate: todayDate() }, { $set: { isCompleted: true } }, { new: true });
    console.log(results);
}

const checkchats = async () => {
    let date1 = new Date();
    console.log(date1);
    let date = date1.setTime(date1.getTime() - 1);
    let date2 = new Date();
    console.log(date - date2);

    let results=await Match.aggregate([
        {
            $project: {
                users:"$users",
                createdAt: "$createdAt",
                next: {
                    $dateAdd:
                    {
                        startDate: "$createdAt",
                        unit: "day",
                        amount: 1
                    }
                },
                today:new Date()
            }
        },
        {
            $project:{
                check:{$subtract:["$today","$next"]},
                users:1
            }
        },
        {$match:{check:{$gt:0}}}
    ]).allowDiskUse(true);

    let filteredresults=results.filter(async res=>{
        let chats=await Chats.findOne({members:{$in:res.users}});
        let set=new Set([]);
        if(chats.messages.length>=2){
            chats.messages.map(chat=>{
                set.add(chat.sender);
            })
        }
        if(set.size()===1){
            return res;
        }
    });

    filteredresults.map(async res=>{
        await Match.findOneAndDelete({users:{$in:res.users}});
        await Chats.findOneAndDelete({members:{$in:res.users}});
    })

}
// checkchats();
// checkcompletedChallenges();
//  hello();