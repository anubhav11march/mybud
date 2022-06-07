const { errormessage, successmessage } = require('../utils/util');
const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');

exports.auth = async (req, res, next) => {
	try {
		const header = req.headers['authorization'];
		const token = header.split(' ')[1];

		if (!token) {
			return res.status(400).json(errormessage('Token not present!'));
		}

		let userid = jwt.verify(token, process.env.TOKEN_SECRET);
		let user = await User.findOne({ _id: JSON.parse(userid) });
		if (!user) {
			return res.status(400).json(errormessage('Not logged in'));
		}
		if (!user.status) {
			return res.status(400).json(errormessage('Email not verified!'));
		}

		req.user = user._id;
		next();
	} catch (err) {
		console.log(err);
		res.status(400).json(errormessage(err.message));
	}
};
