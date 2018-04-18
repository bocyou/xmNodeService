var express = require('express');
var router = express.Router();


router.get('/', function (req, res) {
    res.render('invite_code', {title: ''});

});
module.exports=router;