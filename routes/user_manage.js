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

    mysql.sql('SELECT user_img,user_name,money FROM user_wallet tab1 JOIN users tab2 ON tab1.user_id = tab2.id', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取用户钱包余额失败'});
        } else {
            res.status(200).send({code: 200, result: result, message: '获取用户钱包余额成功'});
        }
    })


});


module.exports=router;