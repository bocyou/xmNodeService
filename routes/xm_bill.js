const express = require('express');
const router = express.Router();
const xlsx = require('node-xlsx');
const mysql = require('../lib/mysql');
const checkSession = require('../middlewares/check_session').checkSession;


function sumMoney(data) {
    let money = 0;
    data.forEach((item, idx) => {
        money += parseInt(item.money);
    })
    return money;
}

router.post('/get_xm_all_money', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('select user_name,user_img,create_time,issue,money,user_id from xm_for_user_bet tab1 JOIN users tab2 ON tab1.user_id=tab2.id', (err, result1) => {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取免费押注信息失败'});
        } else {
            mysql.sql('select user_name,user_img,create_time,issue,money,user_id from scan_injection tab1 JOIN users tab2 ON tab1.user_id=tab2.id', (err, result2) => {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '获取用户扫码小麦注资失败'});
                } else {
                    mysql.sql('select * FROM xm_injection', (err, result3) => {
                        if (err) {
                            res.status(200).send({code: 500, result: [], message: '获取小麦后台注资信息失败'});
                        } else {
                            mysql.sql('select * from give_user_money',(err,result4)=>{
                                if(err){
                                    res.status(200).send({code: 500, result: [], message: '获取小麦后台注资信息失败'});
                                }else{
                                    res.status(200).send({
                                        code: 200,
                                        result: {
                                            scan_money: sumMoney(result2),
                                            xm_injection: sumMoney(result3),
                                            user_free_bet: sumMoney(result1),
                                            give_money:sumMoney(result4),
                                        },
                                        message: 'ok'
                                    });
                                }
                            })


                        }
                    })
                }
            })
        }
    })

});

router.post('/test', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('select * from injection where way=2', (err, result) => {
        if (err) {
        } else {
            result.forEach((item,idx)=>{
                mysql.insert_one('scan_injection',{create_time:new Date(item.create_time),money:1,user_id:item.user_id,issue:item.issue},(result,err)=>{
                    console.log(err);
                })

            })
          console.log(result);
        }
    })


});

/*router.post('/get_scan_code', function (req, res, next) {
    //用户扫码小麦注资
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('select user_name,user_img,create_time,issue,money,user_id from scan_injection tab1 JOIN users tab2 ON tab1.user_id=tab2.id', (err, result) => {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取用户扫码小麦注资失败'});
        } else {
            let ary = result;
            let free_ary = [];
            ary.sort((a, b) => {
                return parseInt(a.user_id) - parseInt(b.user_id);
            });
            for (let i = 0; i < ary.length;) {
                let count = 0;
                let money = 0;
                for (let j = i; j < ary.length; j++) {
                    if (ary[i].user_id == ary[j].user_id) {
                        money += ary[j].money;
                        count++;
                    }
                }
                free_ary.push({
                    user_img: ary[i].user_img,
                    user_name: ary[i].user_name,
                    issue: ary[i].issue,
                    num: count,
                    money: money
                });
                i += count;
            }
            res.status(200).send({code: 200, result: free_ary, message: 'ok'});
        }
    })


});
router.post('/get_scan_code', function (req, res, next) {
    //小麦后台注资
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('select * FROM xm_injection', (err, result) => {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取小麦后台注资信息失败'});
        } else {
            let ary = result;
            let free_ary = [];
            ary.sort((a, b) => {
                return parseInt(a.user_id) - parseInt(b.user_id);
            });
            for (let i = 0; i < ary.length;) {
                let count = 0;
                let money = 0;
                for (let j = i; j < ary.length; j++) {
                    if (ary[i].user_id == ary[j].user_id) {
                        money += ary[j].money;
                        count++;
                    }
                }
                free_ary.push({
                    user_img: ary[i].user_img,
                    user_name: ary[i].user_name,
                    issue: ary[i].issue,
                    num: count,
                    money: money
                });
                i += count;
            }
            res.status(200).send({code: 200, result: free_ary, message: 'ok'});
        }
    })


});*/

module.exports = router;