const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const fs = require('fs');
const path = require('path');

const Chats = require('../models/chat');

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ID,
	secretAccessKey: process.env.AWS_SECRET,
});

exports.generateToken = (userid) => {
	const token = jwt.sign(userid, process.env.TOKEN_SECRET);
	// const token = jwt.sign(userid, "MYBUDSECRET");
	return token;
};

exports.hashPassword = (password) => {
	let hashedpassword = bcrypt.hashSync(password, 8);
	return hashedpassword;
};

exports.verifypassword = (password, hashedpassword) => {
	return bcrypt.compareSync(password, hashedpassword);
};

exports.successmessage = (message, payload = true) => {
	return {
		success: true,
		message,
		data: payload,
	};
};
exports.errormessage = (error) => {
	return {
		success: false,
		error,
	};
};

exports.sendRegisterEmail = async (email, code, username) => {
	let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
	sendSmtpEmail = {
		sender: {
			name: 'MyBud',
			email: 'noreply@eramcapital.com',
		},
		to: [
			{
				email,
				name: username,
			},
		],
		subject: `MyBudd Verification Code`,

		htmlContent: `<h1>Email Confirmation</h1>
    <h2>Hello ${username}</h2>
    <p>Your Verification code is ${code}</div>
	<h2>Team, MyBudd</h2>`,
	};

	try {
		let res = await apiInstance.sendTransacEmail(sendSmtpEmail);
		return res;
	} catch (err) {
		return this.errormessage(err.message);
	}
};

exports.sendInviteEmail = async (email, username, sender, url) => {
	let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
	sendSmtpEmail = {
		sender: {
			name: 'MyBud',
			email: 'noreply@eramcapital.com',
		},
		to: [
			{
				email,
				name: username,
			},
		],
		subject: `Verification Link`,

		htmlContent: `<h1>Buddy Invite</h1>
    <h2>Hello ${username}</h2>
    <p>${sender.username} wants to be your Buddy! </p>
    <a href=${url} >Click Here</a> to accept the invite else ignore
    </div>`,
	};

	try {
		let res = await apiInstance.sendTransacEmail(sendSmtpEmail);
		return res;
	} catch (err) {
		return this.errormessage(err.message);
	}
};

exports.sendForgotEmail = async (email, username, code) => {
	let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
	sendSmtpEmail = {
		sender: {
			name: 'MyBud',
			email: 'noreply@eramcapital.com',
		},
		to: [
			{
				email,
				name: username,
			},
		],
		subject: `Forgot Password`,

		htmlContent: `<h1>Reset Password</h1>
    <h2>Hello ${username}</h2>
    p> OTP to reset your password is ${code},
    </div>`,
	};

	try {
		let res = await apiInstance.sendTransacEmail(sendSmtpEmail);
		return res;
	} catch (err) {
		return this.errormessage(err.message);
	}
};

exports.uploadAws = async (params) => {
	try {
		let data = await s3.upload(params).promise();
		return data;
	} catch (err) {
		console.log(err);
		return this.errormessage(err.message);
	}
};

exports.deletefiles = (directory) => {
	try {
		let files = fs.readdirSync(directory);
		for (const file of files) {
			fs.unlinkSync(path.join(directory, file));
		}
		return this.successmessage('Files deleted !');
	} catch (err) {
		return this.errormessage(err.message);
	}
};

exports.getImage = (params, res) => {
	return new Promise((resolve, reject) => {
		s3.getObject(params)
			.createReadStream()
			.on('error', (error) => {
				reject(error);
			})
			.pipe(res);
	});
};

// exports.allskills = [
// 	'Accounting',
// 	'Advocacy',
// 	'Android Programming',
// 	'Animation',
// 	'Architect',
// 	'B2B Sales',
// 	'B2C Sales',
// 	'Big Data Analytics',
// 	'Blockchain',
// 	'Brand Management',
// 	'Business Development',
// 	'Business Law',
// 	'Canva',
// 	'Choreography',
// 	'Client Servicing',
// 	'Cloud Computing',
// 	'Coaching',
// 	'Commercial Law',
// 	'Communication',
// 	'Company Law',
// 	'Content Management',
// 	'Content Writing',
// 	'Copywriting',
// 	'Cyber Law',
// 	'Data Mining',
// 	'Digital Marketing',
// 	'Ecommerce',
// 	'Editing',
// 	'Event Management',
// 	'Financial Planning and Strategy',
// 	'Forecasting',
// 	'Fundraising',
// 	'Game Development',
// 	'Gaming',
// 	'GDPR',
// 	'Graphic Design',
// 	'Human Resource Management',
// 	'Illustration Tools',
// 	'Industrial Law',
// 	'Influencer Marketing',
// 	'Information Security',
// 	'International Marketing',
// 	'iOS Development',
// 	'JAVA',
// 	'Linux',
// 	'Market Research',
// 	'Marketing',
// 	'Negotiation',
// 	'Network Security',
// 	'Open Source Development',
// 	'Painting',
// 	'People Management',
// 	'Photography',
// 	'Photoshop',
// 	'Presentation Skills',
// 	'Product Design',
// 	'Project Management',
// 	'Proof Reading',
// 	'Public Relations',
// 	'Public Speaking',
// 	'SEO',
// 	'Smart Contracts',
// 	'Social Media Marketing',
// 	'Social Work',
// 	'Software Engineering',
// 	'Stock Markets',
// 	'Storytelling',
// 	'Supply Management',
// 	'Tally',
// 	'Teaching',
// 	'Time Management',
// 	'Trading',
// 	'Travel Planning',
// 	'UX Design',
// 	'Video Editing',
// 	'Video Production',
// 	'Web Analytics',
// 	'Web Application Development',
// 	'Wedding Planning',
// 	'Yoga',
// 	'Script Writing',
// 	'Baking',
// 	'Cooking',
// 	'Anchoring',
// 	'Business Intelligence',
// ];

exports.challenges = [
	{
		Lifestyle: [
			'Avoid phone & laptop screens for 30 minutes before bed ',
			'Avoid using mobile & laptop for 30 minutes after waking up',
			'Read for 20 minutes everyday',
			'No TV Shows and Movies Streaming',
			'Compliment someone everyday',
			'Keep your word',
			'Wakeup before Sunrise',
			'Take an outside walk with your mobile',
			'Write something new everyday(Poem, journal etc)',
		],
		Health: [
			'Eat one fruit daily',
			'Exercise everyday for 20 minutes or more',
			'Do not consume chocolate for',
			'Do not consume junk food',
			'Walk for 30 minutes everyday',
			'Consume only vegetarian diet',
		],
		Pros: [
			'Do not complain',
			'Learn a new word everyday',
			'Work on your side hustle continuously',
			'No Gossiping',
		],
	},
];

exports.todayDate = (date2) => {
	let date = date2 ? date2 : new Date();
	const year = date.getFullYear();
	let month;
	if (date.getMonth() + 1 >= 10) {
		month = `${date.getMonth() + 1}`;
	} else {
		month = `0${date.getMonth() + 1}`;
	}
	let date1 = date.getDate();
	if (date1 < 10) {
		date1 = `0${date1}`;
	}
	return `${year}-${month}-${date1}`;
};

exports.checkValidmatch = async (matches) => {
	//console.log('fdsfd',matches)
	let tobefiltered = await Promise.all(
		matches.map(async (match) => {
			let chats = await Chats.findOne({
				$or: [
					{ members: [match.users[0], match.users[1]] },
					{ members: [match.users[1], match.users[0]] },
				],
			});
			//console.log('sfa',chats)
			if (!chats) {
				return null;
			}
			//console.log(123)
			let set = new Set([]);
			if (chats.messages.length >= 2) {
				chats.messages.map((chat) => {
					set.add(chat.sender.toString());
				});
			}
			//console.log('df',set);
			// return set.size;
			// console.log('df', set.size);
			if (set.size > 1) {
				console.log(1);
				return match;
			} else {
				return null;
			}
		})
	);
	// console.log(tobefiltered)

	return tobefiltered.filter((match) => match);

	// let res = matches.filter(async match => {
	//   let chats = await Chats.findOne({ members: [...match.users] });
	//   if (!chats) {
	//     return
	//   }
	//   let set = new Set([]);
	//   if (chats.messages.length >= 2) {
	//     chats.messages.map(chat => {
	//       set.add(chat.sender);
	//     })
	//   }
	//   // console.log('df', set.size);
	//   if (set.size > 1) {
	//     console.log(1);
	//     return match;
	//   }
	//})
	//return res;
};
