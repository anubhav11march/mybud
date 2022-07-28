const { Router } = require('express');
const { successmessage, errormessage } = require('../utils/util');
const { Adminauth } = require('../middleware/admin');
const AdminController = require('../controllers/admin');
const router = Router();

router.post('/login', AdminController.loginAdmin);

router.get(
	'/allusers',
	// adminAuth,
	AdminController.getAllUsers
);

router.get(
	'/user',
	// adminAuth,
	AdminController.getUser
);

router.get(
	'/matches',
	//Adminauth,
	AdminController.getmatches
);

router.post(
	'/userverify',
	//Adminauth,
	AdminController.UserVerify
);

router.get(
	'/challenges',
	//Adminauth,
	AdminController.AllChallenges
);

router.post(
	'/addChallenge',
	//Adminauth,
	AdminController.AddChallenges
);

module.exports = router;
