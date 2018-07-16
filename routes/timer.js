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

    res.status(200).send('定时任务')

});


var billWork = {
    postBill: function () {
//查询上周是否分发过账单
        mysql.sql('SELECT * FROM user_bill WHERE YEARWEEK(create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result) {
            console.log(err);
            if (err != null) {
                console.log("您本周已分发账单");
                //res.status(200).send( {code: 501, result: {}, message: "您本周已分发账单"})
            } else {
                //查找上周订餐人员的数据   date_format(create_time,"%Y-%m")=date_format( DATE_ADD(now(),INTERVAL -1 WEEK) ,"%Y-%m")
                mysql.findtest('order_food_user', 'users', 'where YEARWEEK(create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1) and tab1.status=1', function (err, result1) {
                    if (err == null) {
                        //上周刮奖人员的数据
                        mysql.findtest('lucky_user_list', 'users', 'where YEARWEEK(create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result2) {
                            if (err == null) {
                                //上周小卖部差价
                                mysql.findtest('shop_money', 'users', 'where YEARWEEK(create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result3) {
                                    if (err == null) {
                                        mysql.findtest('user_bet', 'users', 'where YEARWEEK(create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result4) {
                                            if (err == null) {
                                                mysql.findtest('injection', 'users', 'where YEARWEEK(create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1) AND way="3"', function (err, result5) {
                                                    if (err == null) {
                                                        var result_ary = result1.concat(result2, result3,result4,result5);

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
                                                                    var money_num=0;
                                                                    if(result_ary[j].money!=undefined){
                                                                        money_num=result_ary[j].money
                                                                    }else{
                                                                        if(result_ary[j].spread_money!=undefined){
                                                                            money_num=result_ary[j].spread_money
                                                                        }else{
                                                                            if(result_ary[j].pay_money!=undefined){
                                                                                money_num=result_ary[j].pay_money
                                                                            }else{
                                                                                console.log('未识别');
                                                                                console.log(result_ary[j]);

                                                                            }

                                                                        }

                                                                    }

                                                                    sum_money += parseFloat(money_num);
                                                                }
                                                            }
                                                             console.log(sum_money);
                                                            usr[num] = [];
                                                            usr[num][0] = result_ary[i].user_id;
                                                            usr[num][1] = sum_money;
                                                            usr[num][2] = '1';
                                                            usr[num][3] = new Date();
                                                            usr[num][4] = '';
                                                            num++;

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
                                                                console.log("本周账单分发成功" + new Date());
                                                                // res.status(200).send( {code: 200, result: res_ary, message: "本周账单分发成功"})
                                                            } else {
                                                                console.log("本周账单分发失败" + new Date());
                                                                //res.status(200).send({code: 501, result: err.sqlMessage, message: '插入失败' + err});
                                                            }

                                                        });


                                                    } else {
                                                        console.log("获取用户注资金额失败" + new Date());
                                                        // res.status(200).send( {code: 200, result: {}, message: "获取此用户抽奖信息失败"})
                                                    }

                                                })



                                            } else {
                                                console.log("获取用户押注金额失败" + new Date());
                                                // res.status(200).send( {code: 200, result: {}, message: "获取此用户抽奖信息失败"})
                                            }

                                        })



                                    } else {
                                        console.log("获取用户小卖部花费失败" + new Date());
                                        // res.status(200).send( {code: 200, result: {}, message: "获取此用户抽奖信息失败"})
                                    }

                                })


                            } else {
                                console.log("获取用户抽奖信息失败" + new Date());
                                // res.status(200).send( {code: 200, result: {}, message: "获取此用户抽奖信息失败"})
                            }

                        })
                    } else {
                        console.log("获取用户订餐信息失败" + new Date());
                        //res.status(200).send( {code: 200, result: {}, message: "获取此用户订餐信息失败"})
                    }

                })
            }

        })
    },
    postNotPayNews: function () {

        mysql.sql('SELECT t1.id,open_id,user_name,t2.money,t2.create_time,t3.formid FROM users t1,user_bill t2,user_formid t3 where t1.id=t2.user_id AND t2.user_id=t3.user_id AND t2.status=1',function(err,result){

            if (err == null) {
                var ary = result;
                request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxff898caf09a11846&secret=6f8b1e6559774ab25c0e6ec3b5b1ee26', function (err, response, body) {
                    if (err) {
                        console.log('获取失败ass');
                        // res.status(200).send( {code: 200, result: '获取openid失败'});
                    } else {

                        var access_token = JSON.parse(body).access_token;
                        var res = [];
                        ary.sort(function (a, b) {
                            return a.id - b.id
                        });


                        for (var i = 0; i < ary.length;) {
                            var count = 0;
                            var form_id = [];
                            for (var j = i; j < ary.length; j++) {
                                if (ary[i].id == ary[j].id) {
                                    form_id.push(ary[j].formid);
                                    count++;


                                }
                            }
                            var user_bar = {
                                user_name: ary[i].user_name,
                                open_id: ary[i].open_id,
                                money: ary[i].money,
                                create_time: ary[i].create_time,
                                form_id: form_id
                            };
                            res.push(user_bar);
                            request.post({
                                url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + access_token,
                                form: JSON.stringify({
                                    "touser": user_bar.open_id,
                                    "template_id": "pV3_MQKI_B93MuFLogndJ-XwwlgOGlDFrF9rYqyqE8M",
                                    "page": "pages/me/me",
                                    "form_id": user_bar.form_id[0],
                                    "data": {
                                        "keyword1": {
                                            "value": "小麦未付款账单",
                                            "color": "#173177"
                                        },
                                        "keyword2": {
                                            "value": "请于今日订餐前支付",
                                            "color": "#173177"
                                        },
                                        "keyword3": {
                                            "value": user_bar.money,
                                            "color": "#940020"
                                        },
                                        "keyword4": {
                                            "value": new Date().Format('yyyy年MM月dd日 HH:mm'),
                                            "color": "#173177"
                                        }
                                    },
                                    "emphasis_keyword": "keyword2.value"
                                })
                            }, function (error, response, body) {
                                if (!error && response.statusCode == 200) {


                                    if(JSON.parse(body).errcode==0){
                                        console.log(user_bar.user_name+' 发送成功');
                                        mysql.sql('update user_formid set status=0 where formid="'+user_bar.form_id[0]+'"', function (err, result) {

                                            if (err) {
                                                console.log('重置formid失败');
                                                console.log(err)
                                            } else {


                                            }
                                        });
                                    }else{
                                        console.log(error);
                                    }

                                }
                            })
                            i += count;
                        }

                    }
                });


            } else {
                console.log('查询用户账单失败postNotPayNews');
               // res.status(200).send( {code: 200, result: [], message: "获取所有未付款用户账单失败" + err})
            }
        })

    },
    clearFormId: function () {
        mysql.sql('delete from user_formid where create_time<DATE_ADD(now(),INTERVAL -3 day)', function (err, result) {

            if (result && err == null) {
                console.log('删除formid成功');

            } else {
                console.log('删除formid失败');
                // res.status(200).send({code: 500, result: result, message: '删除formid失败'});
            }
        });
    }
}
//每周一自动分发上周账单
var sat_bill = schedule.scheduleJob({hour: 00, minute: 00, dayOfWeek: 1}, function () {
    console.log('自动分发账单');
    billWork.postBill();
});
//每周一给未付款用户发送账单消息提醒
//清除失效的formid
var sat_bill = schedule.scheduleJob({hour: 10, minute: 00, dayOfWeek: 1}, function () {
    console.log('自动分发账单消息');
    billWork.postNotPayNews();
    billWork.clearFormId();
});

router.post('/post_bill', function (req, res, next) {
    billWork.postBill();
})

module.exports = router;

