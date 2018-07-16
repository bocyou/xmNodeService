var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var crypto = require('crypto');
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;
var schedule = require('node-schedule');
var shopInjection=require('../routes/public/lottery').shopInjection;
router.get('/', function (req, res) {

    res.status(200).send('小麦扫码入账')

});



router.post('/save_shop_money', function (req, res, next) {
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            var money=req.body.money;
            mysql.insert_one('shop_money', {
                user_id: userInfo[0].id,
                money: money,
                create_time: new Date()
            }, function (result, err) {
                if (result&&err==null) {
                    if(money>0){
                       if(Math.round(Math.random())==1){
                           //在奖池中注入1元
                           shopInjection({
                               way: 2,
                               money:1,
                               user_id:userInfo[0].id,
                               success: function (data) {
                                   res.status(200).send( {code: 200, result: true,is_injection:true, message: '扫码入账成功,注资成功'})
                               },
                               error: function (data) {
                                   res.status(200).send( {code: 200, result: true,is_injection:false, message: '扫码入账成功,注资失败'+data})
                               }
                           });
                       }else{
                           res.status(200).send( {code: 200, result: true, message: '扫码入账成功'})
                       }

                    }else{
                        res.status(200).send( {code: 200, result: true, message: '扫码入账成功'})

                    }
                } else {
                    res.status(200).send( {code:500, result: false, message: '扫码入账失败'})
                }
            });
        } else {
            res.status(200).send({code:500, result: [], message: '获取该用户信息失败'});
        }
    });

});


module.exports=router;