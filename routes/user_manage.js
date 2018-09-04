let express = require('express');
let request = require('request');
let router = express.Router();
let mysql = require('../lib/mysql');
let session = require('express-session');
let checkSession = require('../middlewares/check_session').checkSession;
let tool = require('../middlewares/tool');
let getUserInfo = tool.getUserInfo;

router.post('/get_users_wallet', checkSession, function (req, res, next) {
    //获取本期中奖人员
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT user_img,user_name,money,user_id FROM user_wallet tab1 JOIN users tab2 ON tab1.user_id = tab2.id', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取用户钱包余额失败'});
        } else {
            res.status(200).send({code: 200, result: result, message: '获取用户钱包余额成功'});
        }
    })


});

router.post('/post_money', checkSession, function (req, res, next) {
    //给用户发钱
    res.header("Access-Control-Allow-Origin", "*");
    let user_info=req.body;
    let param={
        user_id:user_info.user_id,
        money:user_info.money,
        kind:1,
        create_time:new Date(),
        dsc:'小麦给用户发钱'
    };

    mysql.insert_one('give_user_money', param, function (result, err) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '发钱失败'});

        } else {
           mysql.sql('update user_wallet set money=money+"'+parseInt(user_info.money)+'" where user_id="'+user_info.user_id+'"',(err,result)=>{
               if(err){
                   res.status(200).send({code: 500, result: [], message: '发钱失败'});
               }else{
                   res.status(200).send({code: 200, result: [], message: '发钱成功'});
               }
           });

        }
    });


});

module.exports=router;