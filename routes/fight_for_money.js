/**
 * Created by haoguo on 17/10/16.
 */
const express = require('express');
const request = require('request');
const router = express.Router();
const mysql = require('../lib/mysql');
const session = require('express-session');
const checkSession = require('../middlewares/check_session').checkSession;
const crypto = require('crypto');
const tool=require('../middlewares/tool');
const getUserInfo=tool.getUserInfo;
const getCurrentSession=tool.getCurrentSession;


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});

router.post('/get_data',function(req,res){
    try{
        request.post({
            url: 'http://api.towords.com/tool/fight_for_money.do', formData: {}
        }, function optionalCallback(err, httpResponse, body) {
            const data = JSON.parse(body);
            if(data.code==200){
                res.status(200).send({code: 200, result: data.result, message: "获取数据成功"})
            }else{
                res.status(200).send({code: 500, result: true, message: data.message})
            }


        });
    }catch (e) {

    }

});





module.exports = router;