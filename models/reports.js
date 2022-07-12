const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
	{
		reportedUser: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		reportedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		reason: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Report', ReportSchema);
