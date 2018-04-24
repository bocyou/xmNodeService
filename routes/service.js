/**
 * Created by haoguo on 17/5/31.
 */
var express = require('express');
var request = require('request');
var router = express.Router();
router.get('/', function (req, res) {
    console.log(req.body);
    console.log(req.query.signature);
    console.log(req.query.timestamp);
    console.log(req.query.nonce);
    console.log(req.query.echostr);

    res.status(200).send(req.query.echostr)

});
var user_openid='';
router.post('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");

    user_openid=req.body.FromUserName||user_openid;
    console.log('openid='+user_openid);
    var access_token = '';
    request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxff898caf09a11846&secret=6f8b1e6559774ab25c0e6ec3b5b1ee26', function (err, response, body) {
        if (err) {
            console.log('获取失败ass');
            // res.send(200, {code: 200, result: '获取openid失败'});
        } else {
            console.log(JSON.parse(body));
            access_token = JSON.parse(body).access_token;
            request({
                url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + access_token,
                method: "POST",
                json: true,
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    "touser":'"'+user_openid+'"',
                    "msgtype": "text",
                    "text":
                        {
                            "content": "Hello World"
                        }
                })
            }, function(error, response, body) {
                console.log(body);
                if (!error && response.statusCode == 200) {
                    console.log('发送成功');
                }
            });

       /*
            request.post({
                url: 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + access_token,
                form: {
                    "touser":user_openid,
                    "msgtype": "text",
                    "text":
                        {
                            "content": "Hello World"
                        }
                }

            }, function optionalCallback(err, response, body) {
                console.log('发送请求');
                console.log(body);

                if (err) {
                    console.log('发送失败');
                    // res.send(200, {code: 200, result: '获取openid失败'});
                } else {
                    console.log('发送成功');


                }

            });*/

        }
    });


});


module.exports = router;