/**
 * Created by haoguo on 17/5/31.
 */
var express=require('express');
var router=express.Router();
router.get('/',function(req,res){
    console.log(req);
    console.log(res);
    res.render('index',{title:'首页'});

});

module.exports=router;