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
const cheerio = require('cheerio');


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});
const u1='http://testyourvocab.com/',
    u2='http://testyourvocab.com/step_two',
    u3='',
    api_result='http://testyourvocab.com/result';


function createWords($){
    let options=[];
    $('.wordlist').find("input:checkbox.word").each(function() {
        const obj={
            id:$(this).attr("name"),
            word:$(this).next().text().replace(/(^\s*)|(\s*$)/g, "")
        }
        options.push(obj);
    });
    return options;
}
router.post('/get_step1',function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    request({
        url: u1,
        method: "get",

    }, function (error, response, body) {
        const $ = cheerio.load(body);
        if(error){
            res.status(200).send({code: 500, result: [], message: "获取step1单词失败"})
        }else{

            res.status(200).send({code: 200, result: createWords($), message: "success:获取step1单词"})
        }

    });

});

router.post('/get_step2',function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    const values=JSON.parse(req.body.words);

    request({
        url: 'http://testyourvocab.com/',
        method: "post",
        formData:values

    }, function (error, response, body) {
        if(error){
            res.status(200).send({code: 500, result: [], message: "获取step2单词失败"});
        }else{
            const $ = cheerio.load(body);
            const html_str=$('.submit-bar').html();
            if(html_str){
                const user_id=html_str.replace(/\s/ig,'').match(/values\['user_id'\]=\d+/ig).toString().split('=')[1];

                res.status(200).send({code: 200, result:{words:createWords($),user_id:user_id} , message: "success:获取step2单词"})
            }else{
                res.status(200).send({code: 500, result: [], message: "解析单词内容失败，请刷新重试"});
            }


        }

    });

});

router.post('/save_step2',function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    const values=JSON.parse(req.body.words);
    request({
        url: u2,
        method: "post",
        formData:values

    }, function (error, response, body) {
        if(error){
            res.status(200).send({code: 500, result: [], message: "保存step2失败"});
        }else{

             //保存成功获取成绩
            request({
                url: `${api_result}?user=${values.user_id}`,
                method: "get",

            }, function (error, response, body) {
                if(error){
                    res.status(200).send({code: 500, result: [], message: "获取结果失败"})
                }else{
                    const $ = cheerio.load(body);
                    res.status(200).send({code: 200, result: $('.indexcard .num').text().replace(/\s/ig,''), message: "success:获取step1单词"})
                }

            });

        }

    });

});


router.post('/test',function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    request({
        url: u1,
        method: "get",

    }, function (error, response, body) {
        const $ = cheerio.load(body);
        let values = {'action': 'step_one'};

        $('.wordlist').find("input:checkbox.word").each(function() {
            values[$(this).attr("name")] = $(this).attr("checked") ? 1 : 0;
        });
      /*  $("input:hidden.word").each(function() {
            values[$(this).attr("name")] = $(this).val();
        });*/
        console.log(values);
        request({
            url: 'http://testyourvocab.com/',
            method: "post",
            formData:values

        }, function (error, response, body) {
            const $2 = cheerio.load(body);
            console.log(body);
            $2('.wordlist').find("label").each(function(item,idx) {
               console.log($2(this).text())
            });
        });
    });

});






module.exports = router;