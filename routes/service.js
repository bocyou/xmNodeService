/**
 * Created by haoguo on 17/5/31.
 */
var express=require('express');
var router=express.Router();
router.get('/',function(req,res){
    console.log(req.query);
    console.log(req.param('signature'));
    console.log(req.param('timestamp'));
    console.log(req.param('nonce'));
    console.log(req.param('echostr'));
    res.status(200).send({code: 200, result:req.param('echostr'), message: "参数校验成功"})

});

module.exports=router;