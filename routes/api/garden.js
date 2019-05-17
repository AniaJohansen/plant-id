const express = require("express");
const router = express.Router();
const config = require("config");
const Plant = require("../../models/Plants");

//@Route	get api/garden
//@Desc		User Garden Data
//@Access	Public
router.get("/", (req, res) => {
  console.log(req)
  Plant.find(req.body).then(plant => res.json(plant));
});

module.exports = router;