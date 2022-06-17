const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const cardController = require('../controllers/cards');

const multer = require('multer');

const upload = multer();

router.post('/swipe', auth, upload.none(), cardController.swipecard);

router.get('/getcards', auth, upload.none(), cardController.getCards);

router.get('/getuser', auth, cardController.getUser);

router.get('/getcards1', auth, upload.none(), cardController.getCards1);

router.get('/savedcards', auth, upload.none(), cardController.savecard);

router.post('/setmatchtime', auth, upload.none(), cardController.setmatchtime);

router.get('/getmatchtime', auth, cardController.getMatchesTime);

router.get('/getmatches', auth, cardController.getMatches);

module.exports = router;
