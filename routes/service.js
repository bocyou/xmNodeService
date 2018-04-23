/**
 * Created by haoguo on 17/5/31.
 */
var express=require('express');
var request = require('request');
var router=express.Router();
router.get('/',function(req,res){
    console.log(req.body);
    console.log(req.query.signature);
    console.log(req.query.timestamp);
    console.log(req.query.nonce);
    console.log(req.query.echostr);

    res.status(200).send(req.query.echostr)

});

router.post('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    console.log(req.body);
    var access_token='';
    request.get({
        url: 'https://api.weixin.qq.com/sns/jscode2session', params: {
            grant_type: 'client_credential',
            appid: "wxff898caf09a11846",
            secret: "6f8b1e6559774ab25c0e6ec3b5b1ee26"
        }
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            console.log('获取失败ass');
            // res.send(200, {code: 200, result: '获取openid失败'});
        } else {

            access_token=JSON.parse(body).access_token;
            request.post({
                url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token='+access_token, formData: {
                    "touser":"OPENID",
                    "msgtype":"text",
                    "text":
                        {
                            "content":"Hello World"
                        }
                }

            }, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    console.log('发送失败');
                   // res.send(200, {code: 200, result: '获取openid失败'});
                } else {
                   console.log('发送成功');


                }

            });

        }

    });

});



module.exports=router;