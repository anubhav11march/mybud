const express=require('express');
const router=express.Router();
const {auth}=require('../middleware/auth');
const cardController=require('../controllers/cards');

const multer=require('multer');

const upload=multer();

router.post(
    '/swipe',
    auth,
    upload.none(),
    cardController.swipecard
)

router.get(
    '/getcards',
    auth,
    upload.none(),
    cardController.getCards
)

router.get(
    '/getcards1',
    auth,
    upload.none(),
    cardController.getCards
)

module.exports=router;








