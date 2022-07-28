const mongoose = require('mongoose');

const ChallengeListSchema = new mongoose.Schema(
	{
		Lifestyle: [String],
		Health: [String],
		Pros: [String],
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('ChallengeList', ChallengeListSchema);
