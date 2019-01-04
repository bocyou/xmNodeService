/**
 * Created by haoguo on 17/9/27.
 */
const express = require('express');
const router = express.Router();
const {getUserInfo} = require('../middlewares/tool');
const mysql = require('../lib/mysql');

router.get('/', function (req, res) {
    res.render('test', {title: ''});

});




router.post('/get_year_dinner', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req, res, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT  dinner_list FROM order_food_user tab1  WHERE tab1.status=1 AND tab1.user_id='+userInfo[0].id, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(200).send({code: 500, result: [], message: '获取订餐信息失败'});
                } else {
                    let ary=[];
                    result.forEach((item,idx)=>{
                        const dinner_list=JSON.parse(item.dinner_list)?JSON.parse(item.dinner_list):[];
                        ary=ary.concat(dinner_list);
                    });

                    ary.sort((a,b)=>{
                        return a.list.id-b.list.id;
                    });
                    let result_ary=[];
                    for (let i = 0; i < ary.length;) {
                        let count = 0;
                        for (let j = i; j < ary.length; j++) {

                            if (ary[i].list.id == ary[j].list.id) {
                                count+=ary[j].num;
                            }
                        }
                        result_ary.push({list:ary[i].list,num:count});
                        i += count;
                    }


                    res.status(200).send({code: 200, result: result_ary.sort((a,b)=>{
                            return b.num-a.num;
                        }), message: '获取订餐信息成功'});
                }
            })
        }else{
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    })

});
router.post('/get_year_draw', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req, res, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT  * FROM lucky_user_list  WHERE user_id='+userInfo[0].id, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(200).send({code: 500, result: [], message: '获取刮卡数据失败'});
                } else {
                    const ary=result;
                    let sum_money=0;
                    ary.sort((a,b)=>{
                        return a.money-b.money;
                    });
                    let result_ary=[];
                    for (let i = 0; i < ary.length;) {
                        let count = 0;
                        for (let j = i; j < ary.length; j++) {
                            if (ary[i].money == ary[j].money) {
                                count++;
                            }
                        }
                        sum_money+=ary[i].money*count;
                        result_ary.push({money:ary[i].money,create_time:ary[i].create_time,num:count});
                        i += count;
                    }

                    res.status(200).send({code: 200, result: {list:result_ary,sum_money:sum_money}, message: '获取刮卡数据成功'});
                }
            })
        }else{
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    })

});

router.post('/get_year_user_bet', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req, res, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT  * FROM user_bet  WHERE user_id='+userInfo[0].id, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(200).send({code: 500, result: [], message: '获取用户押注失败'});
                } else {
                    res.status(200).send({code: 200, result: result, message: '获取用户押注数据成功'});
                }
            })
        }else{
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    })

});

router.post('/get_year_user_win_money', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req, res, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT  * FROM lucky_num  WHERE user_id='+userInfo[0].id, function (err, result) {
                if (err) {
                    console.log(err);
                    res.status(200).send({code: 500, result: [], message: '获取用户中奖数据失败'});
                } else {
                    res.status(200).send({code: 200, result: result, message: '获取用户中奖数据成功'});
                }
            })
        }else{
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    })

});
module.exports = router;