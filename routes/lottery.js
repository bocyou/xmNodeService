var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var checkAppSession = require('../middlewares/check_session').checkAppSession;
var crypto = require('crypto');
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;
var schedule = require('node-schedule');

router.get('/', function (req, res) {

    res.status(200).send('彩票')

});

//每周三，周五 10点开奖  获取一次数据，计算中奖用户存入表lucky_num

var work = {
    closeBet: function () {
        var self = this;
        try {
            mysql.sql('SELECT area,id,user_name,user_img,towords_phone FROM users  WHERE area="bj" AND towords_phone is not null', function (err, result) {
                if (err) {
                    //res.status(200).send({code: 500, result: [],message:'查询失败'});
                    console.log('查询失败');
                } else {
                    var users = result;
                    var phone_ary = [];
                    users.forEach(function (item, idx) {
                        phone_ary.push(item.towords_phone);
                    })
                    request.post({
                        url: 'http://preapi.towords.com/fun/count_user_word_week_data.do', formData: {
                            mobile_phone_list: phone_ary
                        }
                    }, function optionalCallback(err, httpResponse, body) {
                        if (err) {
                            //res.status(200).send({code: 500, result: [],message:'与拓词服务器交互失败'});
                            console.log('与拓词服务器交互失败');
                        } else {
                            var towords_data = JSON.parse(body);
                            if (towords_data.code == 200) {
                                //计算单词总数
                                var word_sum = 0;

                                for (var item in towords_data.result) {
                                    word_sum += parseInt(towords_data.result[item]);
                                }
                                if (word_sum < 100) {
                                    word_sum = Math.round(Math.random() * 1000);
                                }
                                var lucky_num = word_sum.toString().substr(word_sum.length - 2, 2);
                                //获取当前是第几期
                                mysql.sql('SELECT * FROM bet_issue bi,(SELECT max(create_time) as max_time FROM bet_issue) max_bi WHERE bi.create_time = max_bi.max_time', function (err, result) {
                                    if (err) {
                                        console.log('获取期数失败');
                                    } else {
                                        var issue = result[0].issue;
                                        var term_id = result[0].id;
                                        var begin_poor = parseInt(result[0].begin_poor);
                                        //查询本期押注情况
                                        mysql.sql('SELECT * FROM user_bet tab1 JOIN users tab2  ON tab1.user_id = tab2.id WHERE issue="' + issue + '"', function (err, result) {
                                            if (err) {
                                                //res.status(200).send({code: 500, result: [],message:'查询失败'});
                                                console.log('查询本期押注情况失败' + err);
                                            } else {
                                                var val = [];
                                                var users = [];
                                                var i = 0;//中奖人员数量
                                                var current_money = 0;//当期押注总金额
                                                result.forEach(function (item, idx) {
                                                    current_money += parseFloat(item.pay_money);
                                                    if (item.num == 12) {
                                                        //中奖人员
                                                        val[i] = [];
                                                        val[i][0] = word_sum;
                                                        val[i][1] = new Date();
                                                        val[i][2] = issue;
                                                        val[i][3] = item.user_id;
                                                        users.push(item.user_id);
                                                        i++;

                                                    }
                                                    //发送中奖消息
                                                });

                                                //存入本期中奖人员
                                                var share_money = parseInt((current_money + begin_poor) / i);//平均每个人所得钱数
                                                for (var j = 0; j < val.length; j++) {
                                                    val[j].push(share_money);
                                                }
                                                var have_win = (val.length > 0 ? 1 : 0);
                                                mysql.sql('update bet_issue set status="0",lucky_num="' + word_sum + '",close_time="' + new Date().Format('yy-MM-dd HH:mm:ss') + '",is_win="' + have_win + '",current_poor="' + current_money + '" where id="' + term_id + '"', function (err, result) {
                                                    if (err) {
                                                        console.log('更新本期状态失败' + err);
                                                    } else {
                                                        if (val.length > 0) {
                                                            //
                                                            mysql.insert_more('lucky_num(`lucky_num`, `create_time`,`issue`,`user_id`,`get_money`)', [val], function (result, err) {
                                                                if (result) {
                                                                    // res.status(200).send( {code: 200, result: 1,message:""})
                                                                    //console.log('开奖成功' + new Date().Format('yyyy/MM/dd HH:mm:ss'));

                                                                    mysql.sql('update user_wallet set money = money + ' + share_money + ' where user_id in (' + users.join(',') + ')', function (err, result) {
                                                                        if (err) {
                                                                            console.log('计入用户钱包失败' + err);
                                                                        } else {
                                                                            console.log('已计入用户钱包' + err);
                                                                            self.startBet();

                                                                        }
                                                                    })

                                                                } else {
                                                                    console.log('开奖失败，存入数据库时失败' + err);
                                                                    // res.status(200).send( {code: 200, result: 0,message:'生成失败'})
                                                                }

                                                            });
                                                        } else {
                                                            self.startBet();
                                                            console.log('本期无中奖人员');
                                                        }


                                                    }
                                                });


                                            }
                                        })
                                    }
                                });


                            } else {
                                //res.status(200).send({code: 500, result: [],message:'拓词服务器返回值不为200'});
                                console.log('拓词服务器返回值不为200');
                            }
                        }
                    });
                }
            })
        } catch (err) {
            console.log(err);

        }


    },
    startBet: function () {
        var self = this;
        try {
            mysql.sql('SELECT * FROM bet_issue bi,(SELECT max(create_time) as max_time FROM bet_issue) max_bi WHERE bi.create_time = max_bi.max_time', function (err, result) {
                if (err) {
                    console.log('查询当前期失败' + err);
                } else {
                    if (result.length > 0) {
                        var last_term = result[0];
                        var term = {
                            status: 1,
                            create_time: new Date(),
                            issue: parseInt(last_term.issue) + 1,
                            lucky_num: '',
                            current_poor: '',
                            is_win: '',
                            begin_poor: 0
                        };


                        if (last_term.is_win == 0) {
                            //没有人中奖
                            term.begin_poor = last_term.current_poor;
                        }


                        mysql.insert_one('bet_issue', term, function (result, err) {
                            if (err) {
                                console.log('开始下一期失败' + err);

                            } else {
                                console.log('成功开启下一期');

                            }
                        });
                    } else {
                        var term = {
                            status: 1,
                            create_time: new Date(),
                            issue: 1,
                            lucky_num: '',
                            current_poor: '',
                            is_win: '',
                            begin_poor: 0
                        };

                        mysql.insert_one('bet_issue', term, function (result, err) {
                            if (err) {
                                console.log('开始下一期失败' + err);

                            } else {
                                console.log('成功开启下一期');

                            }
                        });
                    }
                }
            })

        } catch (err) {
            console.log(err);
        }


    },
    disableBet: function () {
        try {
            //获取当前是第几期
            mysql.sql('SELECT * FROM bet_issue bi,(SELECT max(create_time) as max_time FROM bet_issue) max_bi WHERE bi.create_time = max_bi.max_time', function (err, result) {
                if (err) {
                    console.log('获取期数失败');
                } else {
                    var issue = result[0].issue;
                    var term_id = result[0].id;
                    mysql.sql('update bet_issue set status="2" where id="' + term_id + '"', function (err, result) {
                        if (err) {
                            console.log('更新本期状态失败' + err);
                        } else {
                            console.log('第' + issue + '期已禁止押注' + new Date());


                        }
                    });
                }
            });
        } catch (err) {
            console.log(err);

        }
    },
    renderWallet: function () {
        var self = this;
        //为所有用户创建钱包
        mysql.sql('SELECT * FROM  users ', function (err, result) {
            if (err) {
                //res.status(200).send({code: 500, result: [], message: '查询失败'});
            } else {
                var val = [];
                result.forEach(function (item, idx) {
                    val[idx] = [];
                    val[idx][0] = 0;
                    val[idx][1] = item.id;

                });

                mysql.insert_more('user_wallet(`money`, `user_id`)', [val], function (result, err) {
                    if (result) {
                        // res.status(200).send( {code: 200, result: 1,message:""})
                        console.log('创建钱包成功' + new Date().Format('yyyy/MM/dd HH:mm:ss'));

                    } else {
                        console.log('创建钱包失败' + err);
                        // res.status(200).send( {code: 200, result: 0,message:'生成失败'})
                    }

                });
            }
        })

    }

};
//周三，周五00:00，结束押注(结束当前期)
var disable_bet = new schedule.RecurrenceRule();
disable_bet.dayOfWeek = [3, 5];
disable_bet.hour = 00;
disable_bet.minute = 00;


var disable_bet_work = schedule.scheduleJob(disable_bet, function () {
    work.disableBet();

});


//周三，周五10:00 (结束当前期并开始下一期)

var begin_bet = new schedule.RecurrenceRule();
begin_bet.dayOfWeek = [3, 5];
begin_bet.hour = 10;
begin_bet.minute = 00;

var begin_bet_work = schedule.scheduleJob(begin_bet, function () {
    work.closeBet();

});

/*var close_bet = new schedule.RecurrenceRule();
close_bet.dayOfWeek = [4, 6];
close_bet.hour = 00;
close_bet.minute = 00;
var close_bet_work = schedule.scheduleJob(close_bet, function () {

    work.startBet();

});*/

router.post('/close', function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    work.closeBet();
});
router.post('/disable', function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    work.disableBet();
});

router.post('/get_user_words', checkAppSession, function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT area,id,user_name,user_img,towords_phone FROM users  WHERE area="bj" AND towords_phone is not null', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '查询失败'});
        } else {
            var users = result;
            var phone_ary = [];
            users.forEach(function (item, idx) {
                phone_ary.push(item.towords_phone);
            })
            request.post({
                url: 'http://preapi.towords.com/fun/count_user_word_week_data.do', formData: {
                    mobile_phone_list: phone_ary
                }
            }, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '获取用户单词数失败'});
                } else {
                    var towords_data = JSON.parse(body);
                    if (towords_data.code == 200) {


                        users = users.map(function (item, idx) {
                            item.word = towords_data.result[item.towords_phone];
                            return item;
                        });
                        res.status(200).send({code: 200, result: users, message: '获取用户单词数成功'});

                    } else {
                        res.status(200).send({code: 500, result: [], message: '获取数据失败'});
                    }
                }
            });
        }
    })
});


router.post('/save_user_bet', checkAppSession, function (req, res, next) {
    //保存用户押注数据同时检查是否存在相同押注

    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            //获取当前期的状态
            mysql.sql('SELECT * FROM bet_issue bi,(SELECT max(create_time) as max_time FROM bet_issue) max_bi WHERE bi.create_time = max_bi.max_time', function (err, result) {
                if (err) {
                    console.log('获取期数失败');
                } else {
                    var issue = result[0].issue;
                    var term_id = result[0].id;
                    var term_status = result[0].status;
                    if (term_status == 1) {
                        mysql.sql('SELECT * FROM  user_bet WHERE user_id="' + userInfo[0].id + '" AND issue="' + req.body.issue + '"', function (err, result) {
                            if (err) {
                                res.status(200).send({code: 500, result: [], message: '查询数据库时失败'});
                            } else {
                                var user_num = req.body.num;

                                function isRepeat(ary) {
                                    for (var i = 0; i < ary.length; i++) {
                                        if (ary[i].num == user_num) {
                                            //说明存在重复号码
                                            return true
                                        }
                                    }
                                    return false
                                }

                                if (result.length >= 0 && result.length < 10) {
                                    //保存

                                    if (isRepeat(result)) {
                                        //重复
                                        res.status(200).send({code: 500, result: [], message: '您已押注过此数字！'});
                                    } else {
                                        var param = {
                                            user_id: userInfo[0].id,
                                            create_time: new Date(),
                                            num: req.body.num,
                                            pay_money: 1,
                                            issue: req.body.issue
                                        };

                                        mysql.insert_one('user_bet', param, function (result, err) {
                                            console.log(err);
                                            if (result && err == null) {
                                                res.status(200).send({code: 200, result: true, message: "保存成功"});

                                            } else {
                                                res.status(200).send({code: 500, result: false, message: '保存失败'});

                                            }
                                        });
                                    }


                                } else if (result.length >= 10) {
                                    res.status(200).send({code: 500, result: [], message: '每期押注不能超过10个'});
                                } else {
                                    res.status(200).send({code: 500, result: [], message: '您已押注过此数字！'});
                                }
                            }
                        });
                    } else if (term_status == 2) {
                        res.status(200).send({code: 500, result: [], message: '本期已停止押注'});
                    } else {
                        res.status(200).send({code: 500, result: [], message: '本期已结束'});
                    }

                }
            });


        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});


router.post('/get_lucky_users', checkAppSession, function (req, res, next) {
    //获取本期中奖人员
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT lucky_num, user_img,user_name,get_money FROM lucky_num tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE issue="' + req.body.issue + '"', function (err, result) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '获取本期中奖用户失败'});
                } else {
                    res.status(200).send({code: 200, result: result, message: '获取本期中奖用户成功'});
                }
            })

        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});

router.post('/get_user_bet', checkAppSession, function (req, res, next) {
    //获取本人押注号码
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT * FROM  user_bet WHERE user_id="' + userInfo[0].id + '" AND issue="' + req.body.issue + '"', function (err, result) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '查询失败'});
                } else {
                    res.status(200).send({code: 200, result: result, message: '获取用户押注号码成功'});
                }
            })

        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});

router.post('/get_users_bet', checkAppSession, function (req, res, next) {
    //获取所有人押注号码
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT * FROM  user_bet WHERE  issue="' + req.body.issue + '"', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取本期所有押注记录失败'});
        } else {
            res.status(200).send({code: 200, result: result, message: '获取本期所有押注记录成功'});
        }
    })


});

router.post('/get_bet_issue', checkAppSession, function (req, res, next) {
    //获取期数
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT * FROM bet_issue bi,(SELECT max(create_time) as max_time FROM bet_issue) max_bi WHERE bi.create_time = max_bi.max_time', function (err, result) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '获取本期彩票数据失败'});
                } else {
                    res.status(200).send({code: 200, result: result[0], message: '获取本期彩票数据成功'});
                }
            })

        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});

router.post('/get_custom_bet_issue', checkAppSession, function (req, res, next) {
    //获取期数
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT * FROM bet_issue  WHERE issue="' + req.body.issue + '"', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取本期彩票数据失败'});
        } else {
            res.status(200).send({code: 200, result: result[0], message: '获取本期彩票数据成功'});
        }
    })


});


module.exports = router;