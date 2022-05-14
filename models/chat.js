const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		//chating members:2 member for private chat//
		// roomid:String,
		members: [mongoose.Schema.Types.ObjectId],
		memberslength: {
			type: Number,
			default: 0,
		},
		messages: [
			{
				sender: mongoose.Types.ObjectId,
				reciever: mongoose.Types.ObjectId,
				message: String,
				isRead: { type: Boolean, default: false },
				created: { type: Date, default: Date.now },
			},
		],
	},
	{
		versionKey: false,
		timestamps: true,
	}
);
module.exports = mongoose.model('messages', messageSchema);
