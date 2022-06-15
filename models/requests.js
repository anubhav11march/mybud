const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
	requestedUser: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	requestedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	isAccepted: {
		type: Boolean,
	},
	isPending: {
		type: Boolean,
		default: true,
	},
	creation: {
		type: String,
	},
});

module.exports = mongoose.model('Request', RequestSchema);
