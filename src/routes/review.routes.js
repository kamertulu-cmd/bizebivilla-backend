const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/review.controller");

router.get("/",              ctrl.getFeaturedReviews);
router.get("/all",           ctrl.getAllReviews);
router.get("/stats",         ctrl.getStats);
router.get("/villa/:villaId",ctrl.getVillaReviews);
router.post("/",             ctrl.createReview);

module.exports = router;
