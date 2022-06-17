const mongoose = require('mongoose');
const { Schema } = mongoose;

const MatchSchema = new Schema(
	{
		users: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
		time: {
			type: Date,
			default: Date.now,
		},
		finaltime: {
			type: Date,
		},
	},
	{
		timestamps: { type: Date, default: Date.now },
	}
);

module.exports = mongoose.model('matches', MatchSchema);
