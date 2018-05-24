var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var getUserInfo = require('../middlewares/tool').getUserInfo;
router.get('/', function (req, res) {
    res.render('index', {title: 'logs'});

});

router.post('/get_draw_err', function (req, res, next) {
    mysql.sql('SELECT user_id,user_img,user_name,err_info,tab1.create_time FROM xiaomai_logs tab1 JOIN users tab2 ON tab1.user_id = tab2.id', function (err, result) {
        if (result && result.length > 0) {
            /*     var sum_mony = 0;
                 result.forEach(function (item, idx) {
                     sum_mony += item.money;
                 });*/
            res.status(200).send({code: 200, result: result, message: "获取用户刮奖错误日志-成功"})
        } else {
            res.status(200).send({code: 200, result: 0, message: "获取用户刮奖错误日志-失败"})
        }

    })

});

module.exports = router;