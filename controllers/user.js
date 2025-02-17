const User = require('../models/usermodel');
const Request = require('../models/requests');
const Report = require('../models/reports');
const Message = require('../models/chat');
const Contact = require('../models/contact');
const Challenges = require('../models/challenges');
const MatchSchema = require('../models/match');
const { v4: uuidv4 } = require('uuid');
const {
	generateToken,
	hashPassword,
	successmessage,
	errormessage,
	verifypassword,
	sendRegisterEmail,
	uploadAws,
	sendInviteEmail,
	sendForgotEmail,
} = require('../utils/util');
const { sendNotification } = require('../utils/notification');
const fs = require('fs');

const path = require('path');
const mongoose = require('mongoose');
const Skills = require('../models/skills');

exports.UserSignUp = async (req, res) => {
	try {
		let { username, password, email, phoneno, fcmtoken, isAdmin } = req.body;
		if (!username || !password || !email || !phoneno) {
			return res.status(400).json(errormessage('All fields must be present'));
		}
		console.log(req.body);

		username = username.trim();
		password = password.trim();
		email = email.trim();
		phoneno = phoneno.trim();

		//checking if email exists already and not verified
		let ismatch = await User.findOne({ email, status: false });
		if (ismatch) {
			return res
				.status(400)
				.json(
					errormessage('Email already registered! Verify email to continue!')
				);
		}

		//checking if email exists already and verified
		let ismatch1 = await User.findOne({ email, status: true });
		if (ismatch1) {
			return res
				.status(400)
				.json(
					errormessage(
						'Email already registered and verified! Login to proceed!'
					)
				);
		}

		// checking valid phone no.
		let reg = '(?:(?:\\+|0{0,2})91(\\s*[\\-]\\s*)?|[0]?)?[789]\\d{9}';
		let phonereg = new RegExp(reg);
		if (!phonereg.test(phoneno)) {
			return res.status(400).json(errormessage('Enter valid Phone Number'));
		}

		let ismatch2 = await User.findOne({ phoneno: phoneno });
		if (ismatch2) {
			return res.status(400).json(errormessage('Phone Number Already Taken!'));
		}
		let ismatch3 = await User.findOne({ username: username });
		if (ismatch3) {
			return res.status(400).json(errormessage('Username Already Taken!'));
		}

		//hashing the password
		let hashedpassword = hashPassword(password);

		let confirmationcode = Math.floor(1000 + Math.random() * 9000);

		let result = await sendRegisterEmail(email, confirmationcode, username);

		if (result.error) {
			console.log('Email not sent!');
			return res.status(400).json(errormessage('Email not sent!'));
		}

		let user = new User({
			username,
			password: hashedpassword,
			email,
			phoneno,
			fcmtoken,
			buddyid: uuidv4(),
			confirmationcode,
		});

		//generating token
		const token = generateToken(JSON.stringify(user._id));

		await user.save();
		var data = {
			token,
			userId: user._id,
		};

		res.status(200).json(successmessage('User Created!', data));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.LoginUser = async (req, res) => {
	try {
		let { username, password } = req.body;

		if (!username || !password) {
			return res
				.status(400)
				.json(errormessage('All fields should be present!'));
		}

		username = username.trim();
		password = password.trim();

		// check whether email exists or not
		let user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json(errormessage('Incorrect Username!'));
		}

		if (!verifypassword(password, user.password)) {
			return res.status(400).json(errormessage('Invalid Credentials!'));
		}

		//checking whether verified email or not
		if (user.status === false) {
			return res
				.status(400)
				.json(errormessage('Email not Verified! Please verify your mail!'));
		}
		//checking whether verified email or not
		if (user.adminverified === false) {
			return res
				.status(400)
				.json(errormessage('Account is under verification by admin'));
		}
		if (user.isSuspended === true) {
			return res
				.status(400)
				.json(
					errormessage(
						'Your account has been suspended temporarily. Kindly contact customer care.'
					)
				);
		}
		if (user.isBlocked === true) {
			return res
				.status(400)
				.json(
					errormessage(
						'Your account has been blocked permanently. Kindly contact customer care.'
					)
				);
		}

		// user.fcmtoken = fcmtoken;
		user.lastLogin = new Date();
		await user.save();

		let token = generateToken(JSON.stringify(user._id));

		res.status(200).json(successmessage('Logged In Successfuly!', token));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.verifyCode = async (req, res) => {
	try {
		let { code, email, type } = req.body;

		if (!code || !email || !type) {
			return res.status(400).json(errormessage('All fields must be present!'));
		}

		let findConditions = {
			email,
		};
		if (type === 'forgotpassword') {
			findConditions['forgetpasscode'] = code;
		} else {
			findConditions['confirmationcode'] = code;
		}

		let user = await User.findOne(findConditions);
		if (!user) {
			return res.status(404).json(errormessage('Not Valid code!'));
		}

		user.status = true;
		await user.save();
		res.status(200).json(successmessage('Verified Succesfuly!', user));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.resendOTP = async (req, res) => {
	try {
		let { email } = req.body;

		if (!email) {
			return res
				.status(400)
				.json(errormessage('Email field should be given !'));
		}

		let user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json(errormessage('User not found!'));
		}

		let confirmationcode = Math.floor(1000 + Math.random() * 9000);
		user.confirmationcode = confirmationcode;
		await user.save();

		let result = await sendRegisterEmail(
			user.email,
			user.confirmationcode,
			user.username
		);

		if (result.error) {
			console.log('Email not sent!');
			return res.status(200).json(errormessage('Email not sent!'));
		}
		res.status(200).json(successmessage('Email sent!'));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.Uploadimage = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json(errormessage('Image not provided!'));
		}
		let filetype = req.file.filename.split('.')[1];
		let data = fs.readFileSync(
			`${path.join(__dirname, '../uploads/')}${req.file.filename}`
		);
		let uploads = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `uploads/${uuidv4()}.${filetype}`,
			Body: data,
			ContentType: req.file.mimetype,
			ContentDisposition: 'inline',
		};

		let result = await uploadAws(uploads);
		if (result.error) {
			res.status(500).json(errormessage(result.error));
		}

		//update the returned key and location in user database too.
		let updates = {
			image: {
				key: result.Key,
				filename: req.file.filename,
				location: result.Location,
			},
			imagecheck: true,
		};
		await User.findOneAndUpdate(
			{ _id: mongoose.Types.ObjectId(JSON.parse(req.user)) },
			{ $set: updates }
		);

		let directory = path.join(__dirname, '../uploads');
		deletefiles(directory);

		res.status(200).json(successmessage('File Uploaded Successfuly!'));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getUserimage = async (req, res) => {
	try {
		let { user } = req;
		let { key } = req.query;
		let result = await User.findOne({
			_id: mongoose.Types.ObjectId(JSON.parse(user)),
		});

		if (!result) {
			return res.status(404).json(errormessage('No user found!'));
		}

		let usernew = '';

		if (key) {
			usernew = await User.findOne({ 'image.key': key });
		}

		let location = result.image.location ? result.image.location : '';

		let data = key ? usernew.image.location : location;

		res.status(200).json(successmessage('Successfuly Fetched', data));
		// let params={
		//     Key:key?`${key}`:`${result.image.key}` ,
		//     Bucket:process.env.AWS_BUCKET_NAME,
		// }
		// await getImage(params,res);
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.setdetails = async (req, res) => {
	try {
		let { profession, details, objective, target, skillsets, linkedinprofile } =
			req.body;

		if (
			!profession ||
			!details ||
			!objective ||
			!target ||
			!skillsets ||
			!linkedinprofile
		) {
			return res.status(400).json(errormessage('All fields should be given!'));
		}
		skillsets = skillsets.split(',');
		for (var rev of skillsets) {
			rev = rev.trim();
			const findDoc = await Skills.find({}, { skills: 1 });
			if (findDoc.length) {
				const findSkill = await Skills.find({
					skills: { $in: [new RegExp(`^${rev}$`, 'i')] },
				});
				if (!findSkill.length) {
					findDoc[0].skills.push(rev);
					await findDoc[0].save({ validateBeforeSave: false });
				}
			} else {
				await Skills.create({ skills: skillsets });
			}
		}
		let updates = {
			Info: {
				profession,
				details,
			},
			objective: {
				title: objective,
				target,
			},
			skillsets,
			linkedinprofile,
			detailscheck: true,
		};

		let user = await User.findOneAndUpdate(
			{ _id: mongoose.Types.ObjectId(JSON.parse(req.user)) },
			{ $set: updates },
			{ new: true }
		);
		if (!user) {
			return res.status(400).json(errormessage('Something went wrong!'));
		}

		res.status(200).json(successmessage('Updated Successfuly!', user));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getProfile = async (req, res) => {
	try {
		let user = await User.findOne({
			_id: mongoose.Types.ObjectId(JSON.parse(req.user)),
		});

		if (!user) {
			return res.status(404).json(errormessage('User not found!'));
		}
		user.lastLogin = new Date();
		await user.save();

		let challOn = await Challenges.find({
			userid: mongoose.Types.ObjectId(JSON.parse(req.user)),
			isCompleted: false,
		});
		let challengeNoti = '';
		if (challOn.length) {
			challengeNoti = 'Are you on track? Update your progress';
		}
		let count = await Request.find({
			requestedUser: mongoose.Types.ObjectId(JSON.parse(req.user)),
			isPending: true,
		}).count();
		let matchNoti = '';
		if (count > 0) {
			matchNoti = `${count} want to be your buddy, Pick one now.`;
		}

		var data = { user, matchNoti, challengeNoti };
		res.status(200).json(successmessage('User Profile', data));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.addLocation = async (req, res) => {
	try {
		let { location } = req.body;
		let { user } = req;

		if (!location) {
			return res.status(400).json(errormessage('Provide lOcation!'));
		}

		let updateduser = await User.findOneAndUpdate(
			{ _id: mongoose.Types.ObjectId(JSON.parse(user)) },
			{ $set: { location } },
			{ new: true }
		);
		if (!user) {
			return res.status(400).json(errormessage("Couldn't Update"));
		}
		res.status(200).json(successmessage('Successfuly Updated!', updateduser));
	} catch (err) {
		console.log(err);
		res.status(400).json(errormessage(err.message));
	}
};

exports.getSkills = async (req, res) => {
	try {
		const allSkills = await Skills.find({}, { skills: 1 });
		if (allSkills.length) {
			const skills = allSkills[0].skills;
			return res.status(200).json(successmessage('all skills', skills));
		} else {
			return res.status(200).json(successmessage('all skills', allSkills));
		}
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getfilteredskills = async (req, res) => {
	try {
		let { keyword } = req.query;
		let getSkills = await Skills.find();
		if (getSkills.length) {
			getSkills = getSkills[0].skills;
		}
		let regtomatch = new RegExp(`^${keyword}.*`, 'ig');

		let filteredskills = getSkills.filter((skill) =>
			skill.match(regtomatch) ? skill : null
		);
		res.status(200).json(successmessage('Filtered Skills', filteredskills));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.searchbuddyid = async (req, res) => {
	try {
		let query = {};
		if (req.query.buddyid) {
			query['buddyid'] = req.query.buddyid;
		}
		if (req.query.email) {
			query['email'] = req.query.email;
		}

		let user = await User.find(query);

		res.status(200).json(successmessage('Fetched Succcessfully!', user));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.sendInvite = async (req, res) => {
	try {
		let { buddyid } = req.body;
		let { user } = req;

		user = await User.findOne({
			_id: mongoose.Types.ObjectId(JSON.parse(user)),
		});
		if (!buddyid) {
			return res.status(400).json(errormessage('No buddyid provided!'));
		}

		let inviteuser = await User.findOne({ buddyid });
		if (!inviteuser) {
			return res.status(404).json(errormessage('No User found!'));
		}

		let isMatch = await MatchSchema.findOne({
			$or: [
				{ users: [user._id, inviteuser._id] },
				{ users: [inviteuser._id, user._id] },
			],
		});

		if (isMatch) {
			return res
				.status(400)
				.json(errormessage('You both have been or are a friend!'));
		}

		let url = `https://mybud.herokuapp.com/user/${user.buddyid}/invite/${inviteuser.buddyid}`;
		let result = await sendInviteEmail(
			inviteuser.email,
			inviteuser.username,
			user,
			url
		);
		// let user1 = await User.findOne({ _id: user });
		// if (!user1) {
		// 	return res
		// 		.status(400)
		// 		.json(errormessage("Invite Sent! Couldn't Send Notification!"));
		// }
		await sendNotification(
			'Invite Mail Sent!',
			user.fcmtoken,
			'Invite Mail sent to registered mail ID'
		);
		res.status(200).json(successmessage('Invite Sent!'));
	} catch (err) {
		console.log(err.message);
		res.status(400).json(errormessage(err.message));
	}
};

exports.verifyinvite = async (req, res) => {
	try {
		let user1 = await User.findOne({ buddyid: req.params.userbuddy });
		if (!user1) {
			return res.status(200).json(errormessage('User not found!'));
		}
		let user2 = await User.findOne({ buddyid: req.params.recieverbuddy });
		if (!user2) {
			return res.status(200).json(errormessage('User not found!'));
		}
		let users = [user1._id, user2._id];

		let match = new MatchSchema({
			users,
		});
		await match.save();
		res
			.status(200)
			.json(
				successmessage(`Congratulations ${user1.username} is your friend now!!`)
			);
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.forgotpassword = async (req, res) => {
	try {
		let { email } = req.body;
		if (!email) {
			return res
				.status(400)
				.json(successmessage('Email field should be given!'));
		}
		let user = await User.findOne({ email });
		if (!user) {
			return res
				.status(400)
				.json(errormessage('User not found with the given email!'));
		}
		let confirmationcode = Math.floor(1000 + Math.random() * 9000);
		user.forgetpasscode = confirmationcode;
		await sendForgotEmail(user.email, user.username, confirmationcode);
		await user.save();
		res
			.status(200)
			.json(successmessage('Reset mail sent! Check your emailid!'));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.resetPassword = async (req, res) => {
	try {
		let { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json(errormessage('Provide email or password'));
		}

		let user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json(errormessage('No user found!'));
		}

		//hashing the password
		let hashedpassword = hashPassword(password);
		let updatedUser = await User.findOneAndUpdate(
			{ email },
			{ $set: { password: hashedpassword } },
			{ new: true }
		);
		res
			.status(200)
			.json(successmessage('Password Reset Successful!', updatedUser));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.editskills = async (req, res) => {
	try {
		let { skillsets } = req.body;
		let { user } = req;

		user = mongoose.Types.ObjectId(JSON.parse(user));

		if (!skillsets) {
			return res.status(400).json(errormessage('All fields should be given!'));
		}
		skillsets = skillsets.split(',');
		for (var rev of skillsets) {
			rev = rev.trim();
			const findDoc = await Skills.find({}, { skills: 1 });
			if (findDoc.length) {
				const findSkill = await Skills.find({
					skills: { $in: [new RegExp(`^${rev}$`, 'i')] },
				});
				if (!findSkill.length) {
					findDoc[0].skills.push(rev);
					await findDoc[0].save({ validateBeforeSave: false });
				}
			} else {
				await Skills.create({ skills: skillsets });
			}
		}

		let updates = {
			skillsets,
		};

		let updatedUser = await User.findOneAndUpdate(
			{ _id: user },
			{ $set: updates },
			{ new: true }
		);
		if (!updatedUser) {
			return res.status(400).json(errormessage('Unable to Update!'));
		}

		res.status(200).json(successmessage('Successfuly Updated', updatedUser));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.getUsers = async (req, res) => {
	try {
		const find = User.find();
		res.status(200).json(successmessage('Successfuly Fetched', find));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.deleteUser = async (req, res) => {
	try {
		if (!req.body.userId) {
			return res.status(400).json(errormessage('UserId is required'));
		}
		const find = await User.findByIdAndDelete(req.body.userId);
		res.status(200).json(successmessage('Deleted Successfully', find));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.UpdateFcm = async (req, res) => {
	try {
		let { fcmtoken, userId } = req.body;
		console.log(req.body);

		if (!fcmtoken || !userId) {
			return res
				.status(400)
				.json(errormessage('Fcmtoken & userId is required!'));
		}

		const user = await User.findByIdAndUpdate(userId, req.body, { new: true });

		res.status(200).json(successmessage('Fcmtoken updated Successfuly!', user));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.MarkChatAsRead = async (req, res) => {
	try {
		const findChat = await Message.findOne({
			members: { $all: [req.body.userId1, req.body.userId2] },
		});
		for (const rev of findChat.messages) {
			rev.isRead = true;
		}
		await findChat.save({ validateBeforeSave: false });
		res.status(200).json(successmessage('Marked Successfuly!', findChat));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.GetUnreadMessages = async (req, res) => {
	try {
		const findChat = await Message.find({
			members: { $in: [mongoose.Types.ObjectId(JSON.parse(req.user))] },
		});
		var count = 0;
		for (const rev of findChat) {
			for (const ele of rev.messages) {
				if (ele.reciever === req.user && ele.isRead === false) {
					count++;
				}
			}
		}

		res.status(200).json(successmessage('Fetched Successfuly!', count));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.SendBuddyRequest = async (req, res) => {
	try {
		const check = await User.find({
			_id: req.body.requestedUser,
			buddy: { $exists: true, $ne: '' },
		});
		if (check.length) {
			return res
				.status(400)
				.json(errormessage("User is already someone's buddy"));
		}
		const checkrequest = await Request.findOne({
			requestedBy: mongoose.Types.ObjectId(JSON.parse(req.user)),
			requestedUser: req.body.requestedUser,
		});
		if (checkrequest) {
			if (checkrequest.isAccepted === false) {
				return res
					.status(400)
					.json(errormessage('You cannot send request again'));
			} else if (checkrequest.isPending === true) {
				return res
					.status(400)
					.json(errormessage('You cannot send request again'));
			} else {
				return res
					.status(400)
					.json(errormessage('You cannot send request again'));
			}
		}
		const sendrequest = await Request.create({
			requestedBy: mongoose.Types.ObjectId(JSON.parse(req.user)),
		});
		sendrequest.requestedUser = req.body.requestedUser;
		await sendrequest.save({ validateBeforeSave: false });

		await sendNotification(
			'Buddy Invite!',
			check[0].fcmtoken,
			'You got a buddy invite request!'
		);

		res.status(200).json(successmessage('Request Sent!', sendrequest));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.GetMyBuddyRequests = async (req, res) => {
	try {
		const requests = await Request.find({
			requestedUser: mongoose.Types.ObjectId(JSON.parse(req.user)),
			isPending: true,
		}).populate('requestedBy');

		res.status(200).json(successmessage('Fetched Successfully!', requests));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.AcceptOrRejectBuddyRequest = async (req, res) => {
	try {
		console.log(req.body);
		const checkMe = await User.find({
			_id: mongoose.Types.ObjectId(JSON.parse(req.user)),
			buddy: { $exists: true, $ne: '' },
		});
		if (checkMe.length) {
			return res
				.status(400)
				.json(errormessage("You are already someone's Buddy"));
		}
		const checkOther = await User.find({
			_id: req.body.requestedBy,
			buddy: { $exists: true, $ne: '' },
		});
		if (checkOther.length) {
			return res
				.status(400)
				.json(errormessage("User is someone's else Buddy Now"));
		}
		const request = await Request.findOne({
			requestedUser: mongoose.Types.ObjectId(JSON.parse(req.user)),
			requestedBy: req.body.requestedBy,
			isPending: true,
		});
		console.log('ok2', request);
		if (!request) {
			return res.status(400).json(errormessage('Request not found'));
		}
		request.isAccepted = req.body.isAccepted;
		request.isPending = false;
		await request.save({ validateBeforeSave: false });
		console.log('ok3');
		if (req.body.isAccepted) {
			const findUser = await User.findById(
				mongoose.Types.ObjectId(JSON.parse(req.user))
			);
			console.log('ok4');
			findUser.buddy = req.body.requestedBy;
			await findUser.save({ validateBeforeSave: false });
			const findBuddy = await User.findById(req.body.requestedBy);
			findBuddy.buddy = mongoose.Types.ObjectId(JSON.parse(req.user));
			await findBuddy.save({ validateBeforeSave: false });
			console.log('ok5');

			return res.status(200).json(successmessage('Request Accepted', request));
		}
		return res.status(200).json(successmessage('Request Rejected', request));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.RemoveBuddy = async (req, res) => {
	try {
		const remove = await User.findById(
			mongoose.Types.ObjectId(JSON.parse(req.user))
		);
		const findOther = await User.findOne({
			buddy: JSON.parse(req.user),
		});
		remove.buddy = '';
		await remove.save({ validateBeforeSave: false });
		findOther.buddy = '';
		await findOther.save({ validateBeforeSave: false });

		return res
			.status(200)
			.json(successmessage('Removed Successfully!', remove));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.DeleteAccount = async (req, res) => {
	try {
		const me = await User.findOne({ _id: JSON.parse(req.user) });
		me['isDeleted'] = true;
		await me.save({ validateBeforeSave: false });

		return res.status(200).json(successmessage('Deleted Successfully!', me));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.ReportUser = async (req, res) => {
	try {
		const user = await Report.create(req.body);

		return res.status(200).json(successmessage('Reported Successfully!', user));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};

exports.submitQuery = async (req, res) => {
	try {
		let data = await Contact.create({
			user: mongoose.Types.ObjectId(JSON.parse(req.user)),
			message: req.body.message,
		});

		res.status(200).json(successmessage('Submitted Successfully', data));
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};
