const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		message: {
			type: String,
		},
	},
	{
		versionKey: false,
		timestamps: true,
	}
);
module.exports = mongoose.model('Contact', contactSchema);
