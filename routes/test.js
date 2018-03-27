/**
 * Created by haoguo on 17/9/27.
 */
var express=require('express');
var router=express.Router();
router.get('/',function(req,res){
    res.render('test',{title:''});

});

module.exports=router;