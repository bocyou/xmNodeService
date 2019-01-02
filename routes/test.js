/**
 * Created by haoguo on 17/9/27.
 */
var express = require('express');
var router = express.Router();
var https = require('https');
var request = require('request');
var cheerio = require('cheerio');
const superagent = require('superagent');
router.get('/', function (req, res) {
    res.render('test', {title: ''});

});


router.post('/test', function (req, res, next) {
    superagent
        .get('https://weibo.com/xwang?refer_flag=0000015010_&from=feed&loc=nickname&is_all=1')
        .set('Accept', 'application/json')
        .set('User-Agent', 'BaiduSpider')
        .end(function (err, res) {
            // sleep(1500);
            var body = res.text;
            body.replace(/(\\n|\\t|\\r)/g, " ").replace(/\\/g, "");
            var $ = cheerio.load(body);
            var x = $('.WB_feed_detail .WB_detail ').toArray();
            var y = $('.WB_feed_handle ul').toArray();
            for (var i = 0; i < x.length; i++) {
                var info = ($(y[i]).find('li')).toArray();
                var news = {};
                news.content = ($(x[i]).find('.WB_text').text()).replace(/^(\s|\xA0)+|(\s|\xA0)+$/g, '');
                news.time = ($(x[i]).find('.WB_from  a').attr('title'));
                news.nid = ($(x[i]).find('.WB_from  a').attr('href')).split("?")[0];
                news.commentCnt = ($(info[2]).find('span em')).text().substring(1);       //评论
                news.praiseCnt = ($(info[3]).find('span em')).text().substring(1);        //点赞

                console.log(JSON.stringify(news));
            }

        });


});

router.post('/comment', function (req, res, next) {

    const cookie = 'SINAGLOBAL=8480820548069.099.1516249237389; wb_view_log=2560*14401; wvr=6; wb_view_log_1686137877=2560*14401%261440*9001; TC-Page-G0=1e758cd0025b6b0d876f76c087f85f2c; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WhYuKmK2mCyg0ZMSMFS4fhd5JpX5KMhUgL.Fo2c1hqpe0MRS0M2dJLoIEBLxK.L1h-LBonLxKML1KBL1-eLxKnLBK-LB.qLxKML1KeL1-et; ALF=1577418268; SSOLoginState=1545882268; SCF=Aiflrzl4CQuD_jIgRH95RHX9jRxiJck3Qa44beOEVgd4z787LdOKQoqeGi2DttKtwOU-1nH_hgWW-77-DohVcKQ.; SUB=_2A25xIDrNDeRhGedI41QQ8ynEzDuIHXVSVCsFrDV8PUNbmtAKLVfbkW9NVrczjhG0NFkEIh6y3ncfw_ZeSjHGQtdF; SUHB=0YhgMcZb0smeyE; _s_tentry=login.sina.com.cn; UOR=,,login.sina.com.cn; Apache=4292453804391.5474.1545882275037; ULV=1545882275085:14:3:3:4292453804391.5474.1545882275037:1545877107315; TC-V5-G0=866fef700b11606a930f0b3297300d95';
    console.log(new Date().getTime());
    request({
        url: 'https://weibo.com/aj/v6/comment/add?ajwvr=6&__rnd=1546068073988',
        method: "POST",
        json: true,
        headers: {
            'Host': 'weibo.com',
            'Origin': 'https://weibo.com',
            'Referer': 'https://weibo.com/xwang?refer_flag=0000015010_&from=feed&loc=nickname&is_all=1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',

            'Cookie': 'SINAGLOBAL=8480820548069.099.1516249237389; wvr=6; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WhYuKmK2mCyg0ZMSMFS4fhd5JpX5KMhUgL.Fo2c1hqpe0MRS0M2dJLoIEBLxK.L1h-LBonLxKML1KBL1-eLxKnLBK-LB.qLxKML1KeL1-et; UOR=,,login.sina.com.cn; TC-V5-G0=05e7a45f4d2b9f5b065c2bea790496e2; ALF=1577586309; SSOLoginState=1546050309; SCF=Aiflrzl4CQuD_jIgRH95RHX9jRxiJck3Qa44beOEVgd4HNfnnUR7nFGRvfHybwTv4yQYLwlW4nwTm_ZEY_sHrBI.; SUB=_2A25xIqtVDeRhGedI41QQ8ynEzDuIHXVSWZudrDV8PUNbmtAKLXDBkW9NVrczjlOGqpugvq4pkSARvOBEwnYc1HXT; SUHB=0z1xl7L8HMLT9N; TC-Page-G0=07e0932d682fda4e14f38fbcb20fac81; wb_view_log_1686137877=2560*14401; _s_tentry=login.sina.com.cn; Apache=7382652215683.978.1546050312328; ULV=1546050312378:15:4:4:7382652215683.978.1546050312328:1545882275085'
        },
        formData: {
            "act": "post",
            "mid": "4320808958428027",
            "uid": "1686137877",
            "forward": "0",
            "isroot": "0",
            "content": "87",
            "location": "page_100606_home",
            "module": "scommlist",
            "group_source": " ",
            "tranandcomm": "1",
            "pdetail": "1006062202387347",
            "_t": "0"
        }
    }, function (error, response, body) {
        console.log(error, body, JSON.stringify(response));
        if (!error && response.statusCode == 200) {
        }
    });

    /* request({
         url: 'https://weibo.com/aj/v6/comment/add?ajwvr=6&__rnd='+new Date().getTime(),
         method: "POST",
         json: true,
         headers: {
             'Content-Length': '174',
             'Content-Type': 'application/json; charset=utf-8',
             'Host': 'weibo.com',
             'Origin': 'https://weibo.com',
             'Referer': 'https://weibo.com/xwang?refer_flag=0000015010_&from=feed&loc=nickname&is_all=1',
             'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
             'X-Requested-With': 'XMLHttpRequest',
             'Cookie': 'SINAGLOBAL=8480820548069.099.1516249237389; wvr=6; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WhYuKmK2mCyg0ZMSMFS4fhd5JpX5KMhUgL.Fo2c1hqpe0MRS0M2dJLoIEBLxK.L1h-LBonLxKML1KBL1-eLxKnLBK-LB.qLxKML1KeL1-et; UOR=,,login.sina.com.cn; TC-V5-G0=05e7a45f4d2b9f5b065c2bea790496e2; ALF=1577586309; SSOLoginState=1546050309; SCF=Aiflrzl4CQuD_jIgRH95RHX9jRxiJck3Qa44beOEVgd4HNfnnUR7nFGRvfHybwTv4yQYLwlW4nwTm_ZEY_sHrBI.; SUB=_2A25xIqtVDeRhGedI41QQ8ynEzDuIHXVSWZudrDV8PUNbmtAKLXDBkW9NVrczjlOGqpugvq4pkSARvOBEwnYc1HXT; SUHB=0z1xl7L8HMLT9N; TC-Page-G0=07e0932d682fda4e14f38fbcb20fac81; wb_view_log_1686137877=2560*14401; _s_tentry=login.sina.com.cn; Apache=7382652215683.978.1546050312328; ULV=1546050312378:15:4:4:7382652215683.978.1546050312328:1545882275085',
         },
         formData: {
             "act": "post",
             "mid": "4320808958428027",
             "uid": "1686137877",
             "forward": "0",
             "isroot": "0",
             "content": "hhh",
             "location": "page_100606_home",
             "module": "scommlist",
             "group_source": " ",
             "tranandcomm":"1",
             "pdetail": "1006062202387347",
             "_t": "0"
         }
     }, function(error, response, body) {
         console.log(error,body,response);
         if (!error && response.statusCode == 200) {
         }
     });*/


    /*    request({
            url: 'https://weibo.com/aj/v6/comment/add?ajwvr=6&__rnd='+new Date().getTime(),
            method: "POST",
            headers: {
                'Accept': '*!/!*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Content-Length': '174',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'SINAGLOBAL=8480820548069.099.1516249237389; wvr=6; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WhYuKmK2mCyg0ZMSMFS4fhd5JpX5KMhUgL.Fo2c1hqpe0MRS0M2dJLoIEBLxK.L1h-LBonLxKML1KBL1-eLxKnLBK-LB.qLxKML1KeL1-et; UOR=,,login.sina.com.cn; TC-V5-G0=05e7a45f4d2b9f5b065c2bea790496e2; ALF=1577586309; SSOLoginState=1546050309; SCF=Aiflrzl4CQuD_jIgRH95RHX9jRxiJck3Qa44beOEVgd4HNfnnUR7nFGRvfHybwTv4yQYLwlW4nwTm_ZEY_sHrBI.; SUB=_2A25xIqtVDeRhGedI41QQ8ynEzDuIHXVSWZudrDV8PUNbmtAKLXDBkW9NVrczjlOGqpugvq4pkSARvOBEwnYc1HXT; SUHB=0z1xl7L8HMLT9N; TC-Page-G0=07e0932d682fda4e14f38fbcb20fac81; wb_view_log_1686137877=2560*14401; _s_tentry=login.sina.com.cn; Apache=7382652215683.978.1546050312328; ULV=1546050312378:15:4:4:7382652215683.978.1546050312328:1545882275085',
                'Host': 'weibo.com',
                'Origin': 'https://weibo.com',
                'Referer': 'https://weibo.com/xwang?refer_flag=0000015010_&from=feed&loc=nickname&is_all=1',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: {
                "act": "post",
                "mid": "4315614857681492",
                "uid": "1686137877",
                "forward": "0",
                "isroot": "0",
                "content": "hhh",
                "location": "page_100505_home",
                "module": "scommlist",
                "group_source": " ",
                "tranandcomm":"1",
                "pdetail": "1005051403497553",
                "_t": "0"
            }
        }, function (error, response, body) {
          /!*  if (!error && response.statusCode == 200) {
                console.log(body);
            } else {
                console.log(error);
            }*!/
            console.log(error,body, JSON.stringify(response));
        });*/


});
module.exports = router;