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

router.get('/', function (req, res) {
    res.render('api', {title: ''});

});




//获取本周总钱数
router.post('/get_user_not_pay', function (req, res, next) {

    getCurrentSession(req.headers.sessionkey, function (user_info) {
        if (user_info && user_info.length > 0) {
            var user_id = user_info[0].user_id;

            mysql.findWeek('lucky_user_list', 'user_id="' + user_id + '"', function (result1, err) {
                if (err == null) {
                    mysql.findWeek('order_food_user', 'user_id="' + user_id + '"AND status=1', function (result2, err) {

                        if (err == null) {

                            mysql.findWeek('shop_money', 'user_id="' + user_id +'"', function (result3, err) {
                                if (err == null) {

                                    res.status(200).send( {
                                        code: 200,
                                        result: {lucky: result1, dinner: result2,shop_money:result3},
                                        message: "获取此用户本周账单成功"
                                    })
                                } else {

                                    res.status(200).send( {code: 200, result: {}, message: "获取此用户订餐信息失败"})
                                }

                            })
                        } else {

                            res.status(200).send( {code: 200, result: {}, message: "获取此用户订餐信息失败"})
                        }

                    })
                } else {

                    res.status(200).send( {code: 200, result: {}, message: "获取此用户抽奖信息失败"})
                }

            })
        }

    }, res);


});



//获取本月用户账单
router.post('/get_user_month_bill', function (req, res, next) {

    getCurrentSession(req.headers.sessionkey, function (user_info) {
        if (user_info && user_info.length > 0) {
            var user_id = user_info[0].user_id;

           var end_time=new Date();
           var start_time=new Date(end_time.getTime()-30*24*60*60*1000);
            mysql.sql("SELECT * FROM user_bill WHERE create_time BETWEEN '"+start_time.Format('yyyy-MM-dd')+"' AND '"+end_time.Format('yyyy-MM-dd')+"' AND user_id="+user_id, function (err, result) {


                if (err) {
                    res.status(200).send({code: 500, result: [], message: "获取用户账单失败"})
                    console.log(err);

                } else {

                    res.status(200).send({code: 200, result: result, message: "获取用户前30天内账单成功"})
                }
            });
        }

    }, res);


});






/*//计算本周每个人的账单并发送模版消息
router.post('/get_all_user_bill', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //先在user_bill中查找本周内有没有数据
  //  billWork.postBill();

});*/
//获取当前用户本周账单
router.post('/get_user_bill', function (req, res, next) {

    getCurrentSession(req.headers.sessionkey, function (user_info) {
        if (user_info && user_info.length > 0) {
            var user_id = user_info[0].user_id;
            mysql.conditionSearch('user_bill', 'status="1" AND user_id="' + user_id + '"', function (result, err) {
                if (err == null) {
                    if (result.length == 0) {
                        res.status(200).send( {code: 200, result: result, message: "此用户无拖欠账单"})
                    } else {
                        res.status(200).send( {code: 200, result: result, message: "获取此用户账单成功"})
                    }

                } else {
                    res.status(200).send( {code: 200, result: [], message: "获取此用户账单失败" + err})
                }

            })
        }

    }, res);


});
//获取所有用户未付款账单
router.post('/get_all_user_bill_list', function (req, res, next) {

    mysql.sql('select area,create_time,money,status,update_time,user_img,user_name from users tab2 join user_bill tab1 on tab1.user_id=tab2.id where tab1.status=1',function(err,result){
        if (err == null) {
            res.status(200).send( {code: 200, result: result, message: "获取所有用户未付款账单成功"})

        } else {
            res.status(200).send( {code: 200, result: [], message: "获取所有未付款用户账单失败" + err})
        }
    })

});
//获取本周所有账单
router.post('/get_user_bill_list', function (req, res, next) {
    mysql.findUserWeekBill('SELECT * FROM user_bill tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE YEARWEEK(create_time,1) = YEARWEEK(now(),1)' , function (result, err) {
        if (err == null) {
            res.status(200).send( {code: 200, result: result, message: "获取周用户账单列表成功"})

        } else {
            res.status(200).send( {code: 200, result: {}, message: "获取用户账单列表失败" + err})
        }
    });


});

router.post('/get_user_bill_list', function (req, res, next) {
    mysql.findUserWeekBill('SELECT * FROM user_bill tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE YEARWEEK(create_time,1) = YEARWEEK(now(),1)' , function (result, err) {
        if (err == null) {
            res.status(200).send( {code: 200, result: result, message: "获取周用户账单列表成功"})

        } else {
            res.status(200).send( {code: 200, result: {}, message: "获取用户账单列表失败" + err})
        }
    });
    /*
        mysql.conditionSearch('user_bill', 'status="1" AND user_id="' + user_id + '"', function (result, err) {
            if (err == null) {
                if (result.length == 0) {
                    res.status(200).send( {code: 200, result: result, message: "此用户无拖欠账单"})
                } else {
                    res.status(200).send( {code: 200, result: result, message: "获取此用户账单成功"})
                }

            } else {
                res.status(200).send( {code: 200, result: {}, message: "获取此用户账单失败" + err})
            }

        })*/

});
//获取上月账单
router.post('/get_user_lastmonth_bill_list', function (req, res, next) {

    mysql.findUserWeekBill('SELECT * FROM user_bill tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE  date_format(create_time,"%Y-%m")=date_format( DATE_ADD(now(),INTERVAL -1 MONTH) ,"%Y-%m")' , function (result, err) {
         console.log(err);
        if (err == null) {
            res.status(200).send( {code: 200, result: result, message: "获取周用户账单列表成功"})

        } else {
            res.status(200).send( {code: 200, result: {}, message: "获取用户账单列表失败" + err})
        }
    });


});


//付款
router.post('/user_pay_bill', function (req, res, next) {

    var bill_id = req.body.bill_id;
    console.log(bill_id);
    console.log(new Date().Format('yyyy-MM-dd HH:mm:ss'));
    mysql.updateData('user_bill', 'bill_id="' + bill_id + '"', 'status=0,update_time="' + new Date().Format('yyyy-MM-dd HH:mm:ss') + '"', function (result, err) {
        if (result) {
            res.status(200).send( {code: 200, result: true, message: '账单已结清'});
        } else {
            res.status(200).send( {code: 501, result: err.sqlMessage, message: '结算账单失败'});
        }
    })


});


router.post('/refresh_user_face', function (req, res, next) {

    getUserInfo(req.headers.sessionkey, function (user_info) {
        if (user_info) {
            console.log(req.body.user_img);
                mysql.sql('update users set user_img = '+JSON.stringify(req.body.user_img)+' where id = ' + user_info[0].id,function(err,result){

                    if (result) {
                        res.status(200).send( {code: 200, result: result, message: "更新用户头像成功"})

                    } else {
                        console.log(err);
                        res.status(200).send( {code: 500, result: [], message: "更新用户头像失败" + err})
                    }
                })
        } else {
            res.status(200).send(200, {code: 502, result: false, message: "用户不合法"})
        }


    });


});

module.exports = router;