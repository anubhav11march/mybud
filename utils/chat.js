const mongoose = require('mongoose');
const Message = require('../models/chat');
const Socket = require('../models/socket');
const { sendNotification } = require('./notification');
const { successmessage, errormessage } = require('../utils/util');

exports.checkroom = async (roomid) => {
	let room = await Message.findOne({ roomid });
	if (room) {
		let room1 = await Message.findOne({ roomid, memberslength: { $lt: 2 } });
		if (room1) {
			return successmessage('success');
		}
		return errormessage('room full!');
	}

	return successmessage('Success');
};

exports.addinroom = async (member, roomid) => {
	try {
		let room = await Message.findOneAndUpdate(
			{ roomid },
			{ $inc: { memberslength: 1 } },
			{ new: true }
		);
		if (!room) {
			let message = new Message({
				roomid,
				members: [mongoose.Schema.Types.ObjectId(member)],
				memberslength: 1,
				messages: [],
			});
			await message.save();
		}
	} catch (err) {
		console.log(err.message);
		return errormessage(err.message);
	}
};

exports.storeMessage = async (message, sender, reciever) => {
	let updates = {
		sender: mongoose.Types.ObjectId(sender),
		reciever: mongoose.Types.ObjectId(reciever),
		message,
		created: Date.now(),
	};

	let arr = [
		mongoose.Types.ObjectId(reciever),
		mongoose.Types.ObjectId(sender),
	];

	let findConditions = {
		$or: [
			{
				members: [
					mongoose.Types.ObjectId(reciever),
					mongoose.Types.ObjectId(sender),
				],
			},
			{
				members: [
					mongoose.Types.ObjectId(sender),
					mongoose.Types.ObjectId(reciever),
				],
			},
		],
	};
	//console.log('gr we here')
	let isMatch = await Message.findOne(findConditions);
	//console.log('fdbg',isMatch);
	if (!isMatch) {
		let message = new Message({
			members: [
				mongoose.Types.ObjectId(sender),
				mongoose.Types.ObjectId(reciever),
			],
			memberslength: 2,
			messages: [updates],
		});
		await message.save();
		return;
	}

	await Message.findOneAndUpdate(findConditions, {
		$push: { messages: updates },
	});
	await sendNotification(
		'You have got mail.',
		reciever.fcmtoken,
		'Your buddy needs you.'
	);
};

exports.getMessages = async (user, matcheduser) => {
	user = mongoose.Types.ObjectId(user);
	matcheduser = mongoose.Types.ObjectId(matcheduser);
	let findConditions = {
		$or: [
			{
				members: [
					mongoose.Types.ObjectId(user),
					mongoose.Types.ObjectId(matcheduser),
				],
			},
			{
				members: [
					mongoose.Types.ObjectId(matcheduser),
					mongoose.Types.ObjectId(user),
				],
			},
		],
	};
	let userchats = await Message.findOne(findConditions);
	if (userchats) {
		return userchats.messages;
	}
	return [];
};

exports.deleteSocket = async (socketid) => {
	await Socket.findOneAndDelete({ socketid });
};
