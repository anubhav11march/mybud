const { errormessage, successmessage } = require('../utils/util');
const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');

exports.Adminauth = async (req, res, next) => {
	try {
		const header = req.headers['authorization'];
		const token = header.split(' ')[1];

		if (!token || token === null) {
			return res.status(400).json(errormessage('Token not present!'));
		}

		let userid = jwt.verify(token, process.env.TOKEN_SECRET);
		let user = await User.findOne({ _id: JSON.parse(userid), isAdmin: true });
		if (!user) {
			return res.status(400).json(errormessage('Log in as Admin failed!'));
		}

		req.user = userid;
		next();
	} catch (err) {
		res.status(400).json(errormessage(err.message));
	}
};
