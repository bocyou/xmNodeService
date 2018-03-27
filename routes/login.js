/**
 * Created by haoguo on 17/9/27.
 */
var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;


router.get('/', function (req, res) {
    res.render('test', {title: ''});

});


//后台登陆
router.post('/user_login', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log(req.body);
    /*req.session.user = {};*/
    mysql.conditionSearch('users', 'user_name="'+req.body.user_name+'" AND role="admin" AND password="'+req.body.password+'"', function (result,err) {

        if (err==null && result.length > 0) {
            req.session.user = {
                wx_name:result[0].wx_name,
                role:result[0].role,
                user_name:result[0].user_name,
                area:result[0].area,
                user_img:JSON.parse(result[0].wx_info).avatarUrl
            };
            res.send(200, {code: 200, result: result[0],message:'登陆成功'})
        }else{
            res.send(200, {code: 500, result: {},message:'登陆失败'})

        }

    })

});

//退出登录
router.post('/user_sign_out', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    req.session.user=false;
    res.send(200, {code: 200, result: true,message:'退出成功'})

});

module.exports = router;