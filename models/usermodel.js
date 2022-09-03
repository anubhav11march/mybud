const mongoose = require('mongoose');
const { isEmail } = require('validator');

const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		trim: true,
		username: true,
	},
	buddyid: String,
	password: { type: String },
	email: {
		type: String,
		validate: [isEmail, 'Invalid Email!'],
	},
	phoneno: {
		type: String,
	},
	confirmationcode: String,
	status: {
		type: Boolean,
		default: false,
	},
	image: {
		key: String,
		filename: String,
		location: String,
	},
	Info: {
		profession: String,
		details: String,
	},
	objective: {
		title: String,
		target: String,
	},
	skillsets: [{ type: String }],
	linkedinprofile: String,
	admin: Boolean,
	location: String,
	detailscheck: {
		type: Boolean,
		default: false,
	},
	imagecheck: {
		type: Boolean,
		default: false,
	},
	adminverified: {
		type: Boolean,
		default: false,
	},
	forgetpasscode: String,
	fcmtoken: String,
	limitDate: String,
	buddy: {
		type: String,
	},
	lastLogin: Date,
	isSuspended: {
		type: Boolean,
		default: false,
	},
	isBlocked: {
		type: Boolean,
		default: false,
	},
	isDeleted: {
		type: Boolean,
		default: false,
	},
	isAdmin: {
		type: Boolean,
		default: false,
	},
});

UserSchema.index({ username: 1, email: 1 });

module.exports = mongoose.model('User', UserSchema);
