/**
 * Created by haoguo on 17/10/16.
 */
var express = require('express');

var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkAppSession = require('../middlewares/check_session').checkAppSession;
var checkSession = require('../middlewares/check_session').checkSession;
var tool = require('../middlewares/tool');
var saveLogs = tool.saveLogs;
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;
var schedule = require('node-schedule');

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
                console.log('重置北京奖池失败' + new Date());
                console.log(err)
            } else {
                console.log('重置北京奖池成功' + new Date());

            }
        });
        mysql.sql('update lucky_ary set lucky_ary="' + JSON.stringify(lucky_ary) + '" where id=1', function (err, result) {

            if (err) {
                console.log('重置上海奖池失败' + new Date());
                console.log(err)
            } else {
                console.log('重置上海奖池成功' + new Date());

            }
        });

    }
}


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});

//周一到周五晚上00点重置奖池
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [1, new schedule.Range(2, 5)];
rule.hour = 00;
rule.minute = 00;

var rest_lucky_ary = schedule.scheduleJob(rule, function () {

    lucky.rest();
});


//管理列表获取今天的刮奖情况

router.post('/area_user_draw_list',checkSession, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log(req.body);
    mysql.sql('SELECT area,user_id,user_name,money FROM lucky_user_list tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE to_days(create_time) = to_days(now()) AND area="' + req.body.area + '"', function (err, result) {
        console.log(err);
        if (result && result.length > 0) {
            /*     var sum_mony = 0;
                 result.forEach(function (item, idx) {
                     sum_mony += item.money;
                 });*/
            res.status(200).send({code: 200, result: result, message: "获取所有用户刮奖信息成功"})
        } else {
            res.status(200).send({code: 200, result:[], message: "未查找到刮奖用户"})
        }

    })

});


//检查当前用户是否合法


router.post('/check_current_user', function (req, res, next) {
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo.length > 0) {
            res.status(200).send({code: 200, result: true, message: "该用户合法"})
        } else {
            res.status(200).send({code: 200, result: false, message: "用户不合法"})
        }
    });

});


//获取本月，用户地区所有人员的刮卡记录前三名并根据id计算所有人员的总钱数 和当前用户
//返回姓名，钱数，用户头像
function checkRepeat(obj, ary) {
    var i = ary.length;
    var name = 'user_id';
    while (i--) {
        if (obj[name] == ary[i][name]) {
            return i
        }
    }
    return -1
}

router.post('/month_top_list', checkAppSession, function (req, res, next) {

    getUserInfo(req.headers.sessionkey, function (user_info) {
        if (user_info) {
            mysql.sql('SELECT * FROM lucky_user_list tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE date_format(create_time,"%Y-%m")=date_format(now(),"%Y-%m") and area="' + user_info[0].area + '"', function (err, result) {

                if (err == null && result.length > 0) {
                    //根据用户id排序
                    var statis_ary = [];
                    var me = {};
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
                        var list_obj = {
                            user_name: result[i].user_name,
                            user_img: result[i].user_img,
                            sum_money: all_money,
                            user_id: result[i].user_id
                        }

                        statis_ary.push(list_obj);
                        if (result[i].user_id == user_info[0].id) {
                            me = list_obj
                        }
                        i += count;
                    }

                    statis_ary.sort(function (a, b) {
                        return b.sum_money - a.sum_money
                    });
                    statis_ary = statis_ary.slice(0, 3);
                    if (checkRepeat(me, statis_ary) == -1) {
                        statis_ary.push(me);
                    }


                    res.status(200).send({code: 200, result: statis_ary, message: "本月前三名数据成功"})
                } else {
                    console.log(err);
                    res.status(200).send(200, {code: 200, result: [], message: "本月前三名数据失败"})
                }

            })
        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }


    });


});

//获取所有用户(当天的)刮奖数据并区分当前用户

router.post('/get_user_draw_list', checkAppSession, function (req, res, next) {
    getUserInfo(req.headers.sessionkey, function (user_info) {
        if (user_info) {
            mysql.sql('SELECT user_img,user_name,money FROM lucky_user_list tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE to_days(create_time) = to_days(now()) AND area="' + user_info[0].area + '"', function (err, result) {
                if (result && result.length > 0) {
                    res.status(200).send({code: 200, result: result, message: "获取所有用户刮奖信息成功"})
                } else if (result.length == 0) {

                    res.status(200).send({code: 200, result: [], message: "未查找到刮奖用户"})
                } else {

                    res.status(200).send({code: 200, result: [], message: "未查找到刮奖用户"})
                }

            })
        } else {
            res.status(200).send(200, {code: 502, result: false, message: "用户不合法"})
        }


    });


});


//检查当前用户是否刮奖
router.post('/check_current_user_draw', checkAppSession, function (req, res, next) {
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
                money: 4,
                create_time: new Date()
            };
            var user_area=userInfo[0].area;
            //先检查该用户今天是否刮卡
              mysql.sql('SELECT * FROM lucky_user_list WHERE to_days(create_time) = to_days(now()) AND user_id=' + bar.user_id, function (err, result) {
                  if (result&&err==null) {
                      if (result.length <= 0) {
                          //当天没有刮卡，保存用户刮奖钱数

                          mysql.sql('select * from lucky_ary where area = "' + user_area + '"', function (err, result) {
                              //查询奖池
                              if (result && err == null) {
                                  var ary = JSON.parse(result[0].lucky_ary);
                                  if (ary.length > 0) {
                                      var idx = Math.floor(Math.random() * ary.length);
                                      bar.money = ary[idx];
                                      ary.splice(idx, 1);
                                  } else {
                                      //取3-5中的随机数
                                      bar.money = Math.round(Math.random() * 2 + 3);
                                  }

                                  mysql.sql('update lucky_ary set lucky_ary="' + JSON.stringify(ary) + '" where area="' + user_area + '"', function (err, result) {

                                      if (result&&err == null) {
                                          mysql.insert_one('lucky_user_list', {
                                              user_id: bar.user_id,
                                              money: bar.money,
                                              create_time: new Date()
                                          }, function (result, err) {
                                              if (result&&err==null) {
                                                  res.status(200).send({code: 200, result: bar.money, message: "保存成功"});

                                              } else {
                                                  res.status(200).send({code: 500, result: '', message: '保存刮奖数据失败'});
                                                  saveLogs(bar.user_id, {err: err, message: 'lucky_user_list保存时失败'});
                                              }
                                          });


                                      } else {
                                          res.status(200).send({code: 500, result: result, message: '更新奖池时发生错误'});
                                      }
                                  });
                              } else {
                                  res.status(200).send( {code: 500, result: result, message: '抽奖失败!请稍后重试'});
                                  console.log("查询数组失败" + err);

                              }
                          });

                      } else {
                          res.status(200).send( {code: 500, result: result, message: '您已刮卡，点一次就行了'});
                      }
                  } else {
                      res.status(200).send( {code: 500, result: '', message: '获取刮卡状态失败'})

                  }
              });




        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});


module.exports = router;