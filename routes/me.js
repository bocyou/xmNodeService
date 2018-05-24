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
var billWork={
    postBill:function(){

        mysql.sql('SELECT * FROM user_bill WHERE YEARWEEK(create_time,1) = YEARWEEK(now(),1)', function (err,result) {
            console.log(err);
            if (err != null) {
                console.log("您本周已分发账单");
                //res.status(200).send( {code: 501, result: {}, message: "您本周已分发账单"})
            } else {
                //查找本周订餐人员的数据
                mysql.findtest('order_food_user', 'users', 'where YEARWEEK(create_time,1) = YEARWEEK(now(),1) and tab1.status=1', function (err, result1) {
                    if (err == null) {
                        //本周刮奖人员的数据
                        mysql.findtest('lucky_user_list', 'users', 'where YEARWEEK(create_time,1) = YEARWEEK(now(),1)', function (err, result2) {
                            if (err == null) {
                                var result_ary = result1.concat(result2);
                                //提取userid相同的用户
                                var res_ary = [];
                                result_ary.sort(function (a, b) {
                                    return a.user_id - b.user_id
                                });
                                var num = 0;
                                var usr = [];
                                for (var i = 0; i < result_ary.length;) {
                                    var count = 0;
                                    var sum_money = 0;
                                    for (var j = i; j < result_ary.length; j++) {
                                        if (result_ary[i].user_id == result_ary[j].user_id) {
                                            count++;
                                            sum_money += parseInt(result_ary[j].spread_money == undefined ? result_ary[j].money : result_ary[j].spread_money);
                                        }
                                    }
                                    usr[num] = [];
                                    usr[num][0] = result_ary[i].user_id;
                                    usr[num][1] = sum_money;
                                    usr[num][2] = '1';
                                    usr[num][3] = new Date();
                                    usr[num][4] = '';
                                    num++;
                                    //发送模版信息
                                    res_ary.push({
                                        user_name: result_ary[i].user_name,
                                        user_face: result_ary[i].user_img,
                                        user_id: result_ary[i].user_id,
                                        num: count,
                                        money: sum_money
                                    });
                                    i += count;
                                }

                                mysql.insert_more('user_bill(`user_id`, `money`,`status`,`create_time`,`update_time`)', [usr], function (result, err) {
                                    console.log(err);
                                    if (err == null) {
                                        console.log("本周账单分发成功"+new Date());
                                        // res.status(200).send( {code: 200, result: res_ary, message: "本周账单分发成功"})
                                    } else {
                                        console.log("本周账单分发失败"+new Date());
                                        //res.status(200).send({code: 501, result: err.sqlMessage, message: '插入失败' + err});
                                    }

                                });


                            } else {
                                console.log("获取用户抽奖信息失败"+new Date());
                                // res.status(200).send( {code: 200, result: {}, message: "获取此用户抽奖信息失败"})
                            }

                        })
                    } else {
                        console.log("获取用户订餐信息失败"+new Date());
                        //res.status(200).send( {code: 200, result: {}, message: "获取此用户订餐信息失败"})
                    }

                })
            }

        })
    }
}
//每周六自动分发账单
var sat_bill= schedule.scheduleJob({hour: 00, minute: 00, dayOfWeek: 6}, function(){
    console.log('自动分发账单');
    billWork.postBill();
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

                            res.send(200, {
                                code: 200,
                                result: {lucky: result1, dinner: result2},
                                message: "获取此用户本周账单成功"
                            })
                        } else {

                            res.send(200, {code: 200, result: {}, message: "获取此用户订餐信息失败"})
                        }

                    })
                } else {

                    res.send(200, {code: 200, result: {}, message: "获取此用户抽奖信息失败"})
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






//计算本周每个人的账单并发送模版消息
router.post('/get_all_user_bill', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //先在user_bill中查找本周内有没有数据
  //  billWork.postBill();

});
//获取当前用户本周账单
router.post('/get_user_bill', function (req, res, next) {

    getCurrentSession(req.headers.sessionkey, function (user_info) {
        if (user_info && user_info.length > 0) {
            var user_id = user_info[0].user_id;
            mysql.conditionSearch('user_bill', 'status="1" AND user_id="' + user_id + '"', function (result, err) {
                if (err == null) {
                    if (result.length == 0) {
                        res.send(200, {code: 200, result: result, message: "此用户无拖欠账单"})
                    } else {
                        res.send(200, {code: 200, result: result, message: "获取此用户账单成功"})
                    }

                } else {
                    res.send(200, {code: 200, result: [], message: "获取此用户账单失败" + err})
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
            res.send(200, {code: 200, result: result, message: "获取周用户账单列表成功"})

        } else {
            res.send(200, {code: 200, result: {}, message: "获取用户账单列表失败" + err})
        }
    });
/*
    mysql.conditionSearch('user_bill', 'status="1" AND user_id="' + user_id + '"', function (result, err) {
        if (err == null) {
            if (result.length == 0) {
                res.send(200, {code: 200, result: result, message: "此用户无拖欠账单"})
            } else {
                res.send(200, {code: 200, result: result, message: "获取此用户账单成功"})
            }

        } else {
            res.send(200, {code: 200, result: {}, message: "获取此用户账单失败" + err})
        }

    })*/

});

router.post('/get_user_bill_list', function (req, res, next) {
    mysql.findUserWeekBill('SELECT * FROM user_bill tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE YEARWEEK(create_time,1) = YEARWEEK(now(),1)' , function (result, err) {
        if (err == null) {
            res.send(200, {code: 200, result: result, message: "获取周用户账单列表成功"})

        } else {
            res.send(200, {code: 200, result: {}, message: "获取用户账单列表失败" + err})
        }
    });
    /*
        mysql.conditionSearch('user_bill', 'status="1" AND user_id="' + user_id + '"', function (result, err) {
            if (err == null) {
                if (result.length == 0) {
                    res.send(200, {code: 200, result: result, message: "此用户无拖欠账单"})
                } else {
                    res.send(200, {code: 200, result: result, message: "获取此用户账单成功"})
                }

            } else {
                res.send(200, {code: 200, result: {}, message: "获取此用户账单失败" + err})
            }

        })*/

});
//获取上月账单
router.post('/get_user_lastmonth_bill_list', function (req, res, next) {

    mysql.findUserWeekBill('SELECT * FROM user_bill tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE  date_format(create_time,"%Y-%m")=date_format( DATE_ADD(now(),INTERVAL -1 MONTH) ,"%Y-%m")' , function (result, err) {
         console.log(err);
        if (err == null) {
            res.send(200, {code: 200, result: result, message: "获取周用户账单列表成功"})

        } else {
            res.send(200, {code: 200, result: {}, message: "获取用户账单列表失败" + err})
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
            res.send(200, {code: 200, result: true, message: '账单已结清'});
        } else {
            res.send(200, {code: 501, result: err.sqlMessage, message: '结算账单失败'});
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