/**
 * Created by haoguo on 17/5/31.
 */
var express=require('express');
var router=express.Router();
router.get('/',function(req,res){
    console.log(req.body);
    console.log(req.query.signature);
    console.log(req.query.timestamp);
    console.log(req.query.nonce);
    console.log(req.query.echostr);

    res.status(200).send(req.query.echostr)

});

router.post('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log(req.body);



});

module.exports=router;