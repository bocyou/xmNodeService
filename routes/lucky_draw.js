/**
 * Created by haoguo on 17/10/16.
 */
var express = require('express');

var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkAppSession;
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;
var schedule = require('node-schedule');
//问题刮奖时不能重启服务
var lucky_base = [0, 0, 1, 2, 2, 8, 6];
var lucky_ary = [];

var lucky = {

    rest: function () {
        var self = this;
        //重置刮奖数组
        lucky_ary = [];
        for (var i = 0; i < 20; i++) {
            if (lucky_base[i] == undefined) {
                lucky_ary.push(Math.round(Math.random() * 2 + 3));
            } else {
                lucky_ary.push(lucky_base[i]);
            }

        }
        //乱序(可有可无)
        lucky_ary.sort(function () {
            return Math.random() > .5 ? -1 : 1;
        });

        mysql.sql('update lucky_ary set lucky_ary="' + JSON.stringify(lucky_ary) + '" where id=0', function (err, result) {

            if (err) {
                console.log(err)
            } else {


            }
        });

    }
}


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});

//每天晚上00点重置奖池
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [1, new schedule.Range(2, 5)];
rule.hour = 00;
rule.minute = 00;

var rest_lucky_ary = schedule.scheduleJob(rule, function(){
    console.log('重置奖池');
});





//管理列表计算今天获得的钱数(仅北京地区)

router.post('/sum_user_draw_money', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    mysql.findToday('lucky_user_list', 'area="bj"', function (result, err) {
        if (result && result.length > 0) {
            var sum_mony = 0;
            result.forEach(function (item, idx) {
                sum_mony += item.money;
            });
            res.send(200, {code: 200, result: sum_mony, message: "获取所有用户刮奖信息成功"})
        } else {
            res.send(200, {code: 200, result: 0, message: "未查找到刮奖用户"})
        }

    })

});


//检查当前用户是否合法


router.post('/check_current_user', function (req, res, next) {
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo.length > 0) {
            res.status(200).send({code: 200, result: true, message: "该用户合法"})
        } else {
            res.status(200).send( {code: 200, result: false, message: "用户不合法"})
        }
    });

});



//获取本月，用户地区所有人员的刮卡记录前三名并根据id计算所有人员的总钱数 和当前用户
//返回姓名，钱数，用户头像
router.post('/month_top_list', checkSession, function (req, res, next) {


            mysql.sql('SELECT * FROM lucky_user_list tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE date_format(create_time,"%Y-%m")=date_format(now(),"%Y-%m")', function (err, result) {

                if (err == null && result.length > 0) {
                    //根据用户id排序

                    var statis_ary = [];
                    result.sort(function (a, b) {
                        return a.user_id - b.user_id
                    });

                    for (var i = 0; i < result.length;) {
                        var count = 0;
                        var all_money = 0;
                        for (var j = i; j < result.length; j++) {
                            if (result[i].user_id == result[j].user_id) {
                                count++;

                                all_money += parseInt(result[j].money);
                            }
                        }

                        statis_ary.push({
                            user_name: result[i].user_name,
                            user_img: JSON.parse(result[i].wx_info).avatarUrl,
                            sum_money: all_money
                        });
                        i += count;
                    }

                    statis_ary.sort(function (a, b) {
                        return b.sum_money - a.sum_money
                    });


                    res.send(200, {code: 200, result: statis_ary.slice(0, 3), message: "本月前三名数据成功"})
                } else {

                    res.send(200, {code: 200, result: [], message: "本月前三名数据失败"})
                }

            })



});

//获取所有用户(当天的)刮奖数据并区分当前用户
//如果没有人刮奖则重置lucky_ary
router.post('/get_user_draw_list',checkSession, function (req, res, next) {

            mysql.sql('SELECT user_img,user_name,money FROM lucky_user_list tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE to_days(create_time) = to_days(now())', function (err, result) {
                if (result && result.length > 0) {
                    res.status(200).send( {code: 200, result: result, message: "获取所有用户刮奖信息成功"})
                } else if (result.length == 0) {
                    // 当天没有人刮奖则重置刮奖数组
                    lucky.rest();
                    res.status(200).send( {code: 200, result: [], message: "未查找到刮奖用户"})
                } else {

                    res.status(200).send( {code: 200, result: [], message: "未查找到刮奖用户"})
                }

            })



});
//获取今日，各地区刮出0，8，6的人员
/*router.post('/get_user_special_list', function (req, res, next) {

    getCurrentSession(req.headers.sessionkey, function (user_info) {
        if (user_info && user_info.length > 0) {
            var area = user_info[0].area;
            mysql.findToday('lucky_user_list', 'area="' + area + '"', function (result, err) {
                if (err == null && result.length > 0) {
                    var ary = result.filter(function (item, idx) {
                        return item.money == 0 || item.money == 8 || item.money == 6
                    });

                    res.status(200).send({code: 200, result: ary, message: "获取所有特殊奖项信息成功"})
                } else {

                    res.status(200).send( {code: 200, result: [], message: "获取所有特殊奖项信息失败"})
                }

            })
        }

    }, res);


});*/

//检查当前用户是否刮奖
router.post('/check_current_user_draw',checkSession, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.sessionkey, function (user_info) {
        if (user_info) {
            mysql.findToday('lucky_user_list', 'user_id="' + user_info[0].id + '"', function (result, err) {
                if (result && result.length > 0) {
                    res.status(200).send({code: 200, result: true, message: "该用户已刮奖"})
                } else {
                    res.status(200).send({code: 200, result: false, message: "该用户未刮奖"})
                }
            })
        } else {
            res.status(200).send(200, {code: 502, result: false, message: "用户不合法"})
        }


    });
})

//保存用户刮奖数据

router.post('/save_user_draw', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo.length > 0) {

            var bar = {
                user_id: userInfo[0].id,
                money: 0,
                create_time: new Date()
            };
            //先检查该用户今天是否刮卡

            mysql.sql('SELECT * FROM lucky_user_list WHERE to_days(create_time) = to_days(now()) AND user_id=' + userInfo[0].id, function (err, result) {
                if (err) {
                    res.send(200, {code: 500, result: '', message: '获取刮卡状态失败'})
                } else {
                    if (result.length <= 0) {
                        //当天没有刮卡，保存用户刮奖钱数
                        mysql.sql('select * from lucky_ary where id = 0', function (err, result) {

                            if (err!=null) {
                                res.send(200, {code: 500, result: result, message: '抽奖失败!请稍后重试'});
                                console.log("查询数组失败"+err);
                            } else {

                                var ary = JSON.parse(result[0].lucky_ary);
                                if(ary.length>0){
                                    var idx = Math.round(Math.random() * ary.length);
                                    var money = ary[idx];
                                    ary.splice(idx, 1);
                                    bar.money = money;
                                }else{
                                    //取3-5中的随机数
                                    var money=Math.round(Math.random() * 2 + 3);

                                    bar.money = money;
                                }

                                mysql.sql('update lucky_ary set lucky_ary="' + JSON.stringify(ary) + '" where id=0', function (err, result) {

                                    if (err!=null) {
                                        res.status(200).send({code: 500, result: result, message: '更新奖池时发生错误'});
                                    } else {
                                        mysql.insert_one('lucky_user_list', bar, function (result, err) {

                                            if (err!=null) {
                                                res.send(200, {code: 500, result: '', message: '保存失败'})
                                            } else {
                                                res.status(200).send({code: 200, result: money, message: "保存成功"});

                                            }
                                        });

                                    }
                                });


                            }
                        });

                    } else {
                        res.send(200, {code: 500, result: result, message: '您已刮卡，点一次就行了'});
                    }

                }
            });


        } else {
            res.send(200, {code: 502, result: false, message: "用户不合法"})
        }
    });

});


module.exports = router;