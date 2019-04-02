const express = require('express');
const request = require('request');
const router = express.Router();
const mysql = require('../../lib/mysql');
const session = require('express-session');
const checkSession = require('../../middlewares/check_session').checkSession;
const crypto = require('crypto');
const tool=require('../../middlewares/tool');
const getUserInfo=tool.getUserInfo;
const getCurrentSession=tool.getCurrentSession;


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});

router.post('/add_article',function(req,res){
    res.header("Access-Control-Allow-Origin", "*");

    try{
        const data=req.body;
        data.share_info=data.share_info?JSON.stringify(data.share_info):JSON.stringify('{}');
        data.topic_info=data.topic_info?JSON.stringify(data.topic_info):JSON.stringify('{}');
        let def={
            create_time:new Date()
        };
        const params=Object.assign(def,data);
        if(params.content_html&&params.page_title&&params.page_des){
            mysql.insert_one('towords_article', params, function (result, err) {
                if (err) {
                    res.status(200).send({code: 500, result: false, message: "添加失败"})
                } else {
                    res.status(200).send({code: 200, result: true, message: "添加成功"})
                }
            });
        }else{
            res.status(200).send({code: 500, result: {}, massage: '参数错误'})
        }

    }catch (e) {
        res.status(200).send({code: 500, result: {}, massage: e})
    }

});

router.post('/get_article_list',function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    try{
        mysql.sql('select * from towords_article', function ( err,result) {

            if (err) {
                res.status(200).send({code: 500, result: [], message: "获取列表失败"})
            } else {
                res.status(200).send({code: 200, result: result.map((item)=>{item.topic_info=JSON.parse(item.topic_info);item.share_info=JSON.parse(item.share_info);return item}), message: "获取列表成功"})
            }
        });
    }catch (e) {
        res.status(200).send({code: 500, result: {}, massage: e})
    }

});

router.post('/find_article',function(req,res){
    res.header("Access-Control-Allow-Origin", "*");

    try{
        const id=req.body.id;
        mysql.find_one('towords_article', 'id', [id], function (result,err) {
            if (err) {
                console.log(err);

                res.status(200).send({code: 500, result: {}, massage: '获取文章失败'})

            } else {
                let data=result[0];
                data.share_info=JSON.parse(data.share_info);
                data.topic_info=JSON.parse(data.topic_info);
                res.status(200).send({code: 200, result: data, massage: '获取文章成功'})
            }

        });
    }catch (e) {
        res.status(200).send({code: 500, result: {}, massage: e})
    }

});





module.exports = router;