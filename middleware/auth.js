const { errormessage, successmessage } = require('../utils/util');
const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');

exports.auth = async (req, res, next) => {
	try {
		const header = req.headers['authorization'];
		const token = header.split(' ')[1];

		if (!token || token === null) {
			return res.status(400).json(errormessage('Token not present!'));
		}

		let userid = jwt.verify(token, process.env.TOKEN_SECRET);
		let user = await User.findOne({ _id: JSON.parse(userid) });
		console.log(user);
		if (!user) {
			return res.status(400).json(errormessage('Not logged in'));
		}
		if (!user.status) {
			return res.status(400).json(errormessage('Email not verified!'));
		}

		req.user = userid;
		next();
	} catch (err) {
		console.log(JSON.parse(JSON.stringify(err)));
		res.status(400).json(errormessage(JSON.parse(JSON.stringify(err))));
	}
};
