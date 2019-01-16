const express = require('express');

const router = express.Router();
const mysql = require('../lib/mysql');

const tool = require('../middlewares/tool');
const getUserInfo = tool.getUserInfo;
//const shopInjection=require('../routes/public/lottery').shopInjection;
const {updateUserSpend}=require('../middlewares/update_user_spend');
router.get('/', function (req, res) {

    res.status(200).send('小麦扫码入账')

});



router.post('/save_shop_money', function (req, res, next) {
    getUserInfo(req,res, function (userInfo) {
        console.log(`${userInfo[0].user_name} 扫码注资 ${new Date()}`);
        if (userInfo&&userInfo.length>0) {
            const money=req.body.money;
            mysql.insert_one('shop_money', {
                user_id: userInfo[0].id,
                money: money,
                create_time: new Date()
            }, function (result, err) {
                if (result&&err==null) {
                /*    if(money>1){
                       if(Math.round(Math.random())==1){
                           //在奖池中注入1元
                           shopInjection({
                               way: 2,
                               money:1,
                               user_id:userInfo[0].id,
                               success: function (data) {

                                   res.status(200).send( {code: 200, result: true,is_injection:true, message: '扫码入账成功,注资成功'})
                               },
                               error: function (data) {
                                   console.log(data);
                                   res.status(200).send( {code: 200, result: true,is_injection:false, message: '扫码入账成功,注资失败'+data})
                               }
                           });
                       }else{

                           res.status(200).send( {code: 200, result: true, message: '扫码入账成功'})
                       }

                    }else{
                        res.status(200).send( {code: 200, result: true, message: '扫码入账成功'})

                    }*/

                    //更新用户消费
                    updateUserSpend({
                        user_id:userInfo[0].id,
                        money:money,
                        error:(err,message)=>{
                            res.status(200).send( {code: 500, result: true, message: message});
                        },
                        success:result=>{
                            res.status(200).send( {code: 200, result: true, message: '扫码入账成功'});
                        }

                    });

                } else {
                    res.status(200).send( {code:500, result: false, message: '扫码入账失败'})
                }
            });
        } else {
            res.status(200).send({code:502, result: [], message: '获取该用户信息失败'});
        }
    });

});


module.exports=router;