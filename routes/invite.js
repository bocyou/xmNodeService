/**
 * Created by haoguo on 17/10/16.
 */
 var express = require('express');
 var request = require('request');
 var router = express.Router();
 var mysql = require('../lib/mysql');
 var session = require('express-session');
 var checkSession = require('../middlewares/check_session').checkSession;
 var crypto = require('crypto');
 var tool=require('../middlewares/tool');
 var getUserInfo=tool.getUserInfo;
 var getCurrentSession=tool.getCurrentSession;


 router.get('/', function (req, res) {
    res.render('api', {title: ''});

});



//获取邀请码列表
router.post('/get_invite_list', function (req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");

    mysql.conditionSearch('invite_code','status="1"', function (result, err) {
        if (err==null&&result.length>0) {

             res.send(200, {code: 200, result: result,message:"获取邀请码列表成功"})
            
          }else{
            res.send(200, {code: 200, result: {},message:'没有查到数据'})
          }

        });

});


//生成邀请码
router.post('/create_invite',checkSession, function (req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   console.log(req.body);
   var num=req.body.num;//生成
   var val=[];
   for(var i=0;i<num;i++){
     var code='xm'+parseInt((Math.random()*9+1)*100000);
     val[i]=[];
     val[i][0]=code;
     val[i][1]=new Date();
     val[i][2]=1;
     val[i][3]=null;
    
   }

   mysql.insert_more('invite_code(`code`, `create_time`,`status`,`expire_time`)',[val], function ( result,err) {
    console.log(result)
        if (result) {
             res.send(200, {code: 200, result: 1,message:"生成邀请码成功"})
            
          }else{
             res.send(200, {code: 200, result: 0,message:'生成失败'})
          }

        });

});




module.exports = router;