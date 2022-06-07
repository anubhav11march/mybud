const express = require('express');
const router = express.Router();
const path = require('path');
const Usercontroller = require('../controllers/user');
const { auth } = require('../middleware/auth');
const User = require('../models/usermodel');
const multer = require('multer');

const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, path.join(__dirname, '../uploads'));
	},
	filename: (req, file, callback) => {
		callback(null, file.originalname);
	},
});
console.log(path.join(__dirname, '../uploads'));
const upload = multer({ storage });

router.post('/signup', upload.none(), Usercontroller.UserSignUp);
router.post('/login', upload.none(), Usercontroller.LoginUser);
router.get('/me', auth, async (req, res) => {
	let user = await User.findOne({ _id: JSON.parse(req.user) });
	res.json(user);
});

router.post('/verifyemail', upload.none(), Usercontroller.verifyCode);

router.post('/resendotp', upload.none(), Usercontroller.resendOTP);

router.post(
	'/upload',
	auth,
	upload.single('image'),
	Usercontroller.Uploadimage
);

router.get('/get/image', auth, upload.none(), Usercontroller.getUserimage);

router.post('/add/details', auth, upload.none(), Usercontroller.setdetails);

router.get('/get/profile', auth, upload.none(), Usercontroller.getProfile);

router.post('/add/location', auth, upload.none(), Usercontroller.addLocation);

router.get('/allskills', auth, Usercontroller.getSkills);

router.get('/filteredskills', auth, Usercontroller.getfilteredskills);

router.get('/searchbuddy', auth, Usercontroller.searchbuddyid);

router.post('/sendinvite', auth, upload.none(), Usercontroller.sendInvite);

router.get('/:userbuddy/invite/:recieverbuddy', Usercontroller.verifyinvite);

router.post('/forgotpassword', upload.none(), Usercontroller.forgotpassword);

router.post('/resetpassword', upload.none(), Usercontroller.resetPassword);

router.patch('/editskill', auth, upload.none(), Usercontroller.editskills);

router.get('/getUsers', upload.none(), Usercontroller.getUsers);

router.post('/deleteUser', upload.none(), Usercontroller.deleteUser);

router.post('/updateFcmtoken', upload.none(), Usercontroller.UpdateFcm);

router.post('/markChatAsRead', upload.none(), Usercontroller.MarkChatAsRead);

router.post(
	'/sendBuddyRequest',
	auth,
	upload.none(),
	Usercontroller.SendBuddyRequest
);

router.get(
	'/getMyBuddyRequests',
	auth,
	upload.none(),
	Usercontroller.GetMyBuddyRequests
);

router.post(
	'/manageRequest',
	auth,
	upload.none(),
	Usercontroller.AcceptOrRejectBuddyRequest
);

router.get('/removeBuddy', auth, upload.none(), Usercontroller.RemoveBuddy);

router.get(
	'/getUnreadMessages',
	auth,
	upload.none(),
	Usercontroller.GetUnreadMessages
);

module.exports = router;
