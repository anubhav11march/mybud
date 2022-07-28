const mongoose = require('mongoose');
const User = require('../models/usermodel');
const Challenges = require('../models/challenges');
const ChallengeList = require('../models/challengeList');
const matchModel = require('../models/match');
const {
	successmessage,
	errormessage,
	verifypassword,
	generateToken,
	challenges,
} = require('../utils/util');

exports.loginAdmin = async (req, res) => {
	try {
		let { email, password } = req.body;

		if (!email || !password) {
			return res
				.status(400)
				.json(errormessage('All fields should be present!'));
		}

		email = email.trim();
		password = password.trim();

		// check whether email exists or not
		let user = await User.findOne({ email, isAdmin: true });
		if (!user) {
			return res.status(400).json(errormessage('Email or password incorrect!'));
		}

		if (!verifypassword(password, user.password)) {
			return res.status(400).json(errormessage('Invalid Credentials!'));
		}

		//checking whether verified email or not
		// if (!user.status) {
		//     return res.status(400).json(errormessage("Email not Verified! Please verify your mail!"));
		// }

		// user.fcmtoken = fcmtoken;
		await user.save();

		let token = generateToken(JSON.stringify(user._id));

		res.status(200).json(successmessage('Logged In Successfuly!', token));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getAllUsers = async (req, res) => {
	try {
		let perpage = 20;

		let { page } = req.query;
		console.log(page);
		if (!page || !parseInt(page)) {
			return res
				.status(400)
				.json(errormessage('Page no should be present or should not be zero!'));
		}

		page = parseInt(page);
		let start = (page - 1) * perpage;

		let count = await User.countDocuments();
		let counts = count - start;
		let total_pages =
			count % perpage === 0
				? parseInt(count / perpage)
				: parseInt(count / perpage) + 1;

		let pagesleft =
			counts % perpage === 0
				? parseInt(counts / perpage)
				: parseInt(counts / perpage);
		let users = await User.find({ status: true })
			.sort({ _id: -1 })
			.skip(start)
			.limit(perpage);
		res
			.status(200)
			.json(successmessage('All Users', { users, pagesleft, total_pages }));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getUser = async (req, res) => {
	try {
		let { id } = req.query;

		let user = await User.find({ _id: mongoose.Types.ObjectId(id) });
		if (!user) {
			return res.status(404).json(errormessage('User not found!'));
		}
		res.status(200).json(successmessage('user Details', user));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getmatches = async (req, res) => {
	try {
		let matches = await matchModel
			.aggregate([
				{
					$lookup: {
						from: 'users',
						let: { uid: '$users' },
						pipeline: [
							{ $match: { $expr: { $in: ['$_id', '$$uid'] } } },
							{
								$project: {
									password: 0,
									confirmationcode: 0,
									status: 0,
								},
							},
						],
						as: 'userdata',
					},
				},
			])
			.allowDiskUse(true);
		res.status(200).json(successmessage('user Details', matches));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.UserVerify = async (req, res) => {
	try {
		let { user, status } = req.body;
		if (status) {
			let user1 = await User.findOneAndUpdate(
				{ _id: mongoose.Types.ObjectId(user) },
				{ $set: { adminverified: true } },
				{ new: true }
			);
			return res
				.status(200)
				.json(successmessage('Verified Successfuly!', user1));
		}

		let user1 = await User.findOneAndDelete({
			_id: mongoose.Types.ObjectId(user),
		});
		res.status(200).json(errormessage('Successfuly Removed User!', user1));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getChallenges = (req, res) => {
	let data = await ChallengeList.find();
	res.status(200).json(successmessage('All Challenges', data));
};

exports.AllChallenges = async (req, res) => {
	try {
		let data = await Challenges.find();
		return res.status(200).json(successmessage('Fetched Successfuly!', data));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.AddChallenges = async (req, res) => {
	try {
		let data = await ChallengeList.find();
		if(req.body.lifestyle){
        data[0].Lifestyle.push(req.body.lifestyle);}
		if(req.body.health){
        data[0].Health.push(req.body.health);}
		if(req.body.pros){
        data[0].Pros.push(req.body.pros);}
		await data.save({validateBeforeSave: false})
		return res.status(200).json(successmessage('Created Successfuly!', data));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.RemoveChallenges = async (req, res) => {
	try {
		let data = await ChallengeList.find();
		if(req.body.lifestyle){
        data[0].Lifestyle.filter(e => e !== req.body.lifestyle);}
		if(req.body.health){
        data[0].Health.filter(e => e !==req.body.health);}
		if(req.body.pros){
        data[0].Pros.filter(e => e !==req.body.pros);}
		await data.save({validateBeforeSave: false})
		return res.status(200).json(successmessage('Removed Successfuly!', data));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};