/**
 * Created by haoguo on 17/9/27.
 */
const express = require('express');
const router = express.Router();

const request = require('request');
const cheerio = require('cheerio');
const superagent = require('superagent');
router.get('/', function (req, res) {
    res.render('test', {title: ''});

});
function getQueryString (str,name) {

    const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = str.toString().match(reg);
    if (r != null) return decodeURIComponent(r[2].toLowerCase());
    return null;
}




const work={

    comment(formData,cookie,connection){

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

                'Cookie': cookie
            },
            formData: formData
        }, function (error, response, body) {
           // console.log(error, body, JSON.stringify(response));

            if (!error && response.statusCode == 200) {
                connection.sendUTF(JSON.stringify({ type:'weibo_success',code: 200, message: "评论成功"}));
            }else if(!error && response.statusCode == 302){
                connection.sendUTF(JSON.stringify({ type:'webo_err',code: 200, message: "评论失败！（cookie失效请重新复制）"}));
            }else{
                connection.sendUTF(JSON.stringify({ type:'webo_err',code: 200, message: "评论失败"}));
            }
        });
    },
    getHomeWeibo:function(connection,data){


        try{
            connection.user_status=1;
            connection.last_update_time=0;//用来判断微博是否删除（只能精确到分）
            connection.last_weibo=0;//用来判断微博变动。
            connection.user_cookie=data.cookie;
            console.log('开始获取微博信息');
            connection.count_num=0;
            connection.getWeibo=function (data){
                superagent
                    .get(data.url)
                    .set('Accept', 'application/json')
                    .set('User-Agent', 'BaiduSpider')
                    .end(function (err, res) {
                        const body = res.text;
                        body.replace(/(\\n|\\t|\\r)/g, " ").replace(/\\/g, "");
                        const $ = cheerio.load(body);
                        const x = $('.WB_feed_detail .WB_detail ').toArray();
                        const y = $('.WB_feed_handle ul').toArray();


                        let info_ary=[];
                        try{
                            //假如用户没有微博将会报错
                            for (let i = 0; i < x.length; i++) {
                                const info = ($(y[i]).find('li')).toArray();
                                const common_data=($(info[2]).find('a')).attr('action-data');
                                const news = {};
                                news.content = ($(x[i]).find('.WB_text').text()).replace(/^(\s|\xA0)+|(\s|\xA0)+$/g, '');
                                news.time = ($(x[i]).find('.WB_from  a').attr('title'));
                                news.nid = ($(x[i]).find('.WB_from  a').attr('href')).split("?")[0];
                                news.commentCnt = ($(info[2]).find('span em')).text().substring(1);       //评论
                                news.praiseCnt = ($(info[3]).find('span em')).text().substring(1);//点赞
                                news.update_time=new Date(news.time).getTime();

                                news.mid=($(x[i]).parent().parent()).attr('mid');
                                news.ouid=getQueryString(common_data,'ouid');
                                news.location='page_100505_home';
                                news.comment_type=getQueryString(common_data,'comment_type');
                                news.pdetail = getQueryString(($(x[i]).find('.WB_from  a').attr('href')).split('?')[1],'from').replace(/\D/ig,'');
                                info_ary.push(news);
                                //console.log(JSON.stringify(news));
                            }

                        }catch (e) {
                            console.log('解析失败',e);
                        }

                        const first_weibo_update_time=info_ary[0]?info_ary[0].update_time:0;//如果没有按第一次计算
                        const last_weibo=info_ary[0]?info_ary[0].mid:0;
                        console.log(first_weibo_update_time,connection.last_update_time);

                        if(connection.last_update_time===0){
                            //首次进入
                            connection.sendUTF(JSON.stringify({result: info_ary, type:'get_weibo_info',code: 200, message: "解析成功"}));
                            connection.last_update_time=first_weibo_update_time;
                            connection.last_weibo=last_weibo;

                        }else{
                            if(last_weibo!== connection.last_weibo){
                                //说明微博变动了
                                if(first_weibo_update_time>= connection.last_update_time){
                                    console.log('微博更新了');
                                    if(connection.user_cookie){
                                        const formData=info_ary[0];
                                        console.log(formData);
                                        work.comment( {
                                            "act": "post",
                                            "mid": formData.mid,
                                            "uid": formData.ouid,
                                            "forward": "0",
                                            "isroot": "0",
                                            "content": data.common_txt?data.common_txt:'ok',
                                            "location": "page_100505_home",
                                            "module": "scommlist",
                                            "group_source": " ",
                                            "pdetail": formData.pdetail,
                                            "_t": "0"
                                        },connection.user_cookie.trim(),connection)
                                    }
                                }else{
                                    console.log('微博删除了');
                                }
                                connection.sendUTF(JSON.stringify({result: info_ary, type:'get_weibo_info',code: 200, message: "解析成功"}));
                                connection.last_update_time=first_weibo_update_time;
                                connection.last_weibo=last_weibo;
                            }

                        }
                        connection.sendUTF(JSON.stringify({num:connection.count_num++, type:'webo_count',code: 200, message: "解析成功"}));
                        console.log('成功获取',new Date().Format('yyyy/MM/dd HH:mm:ss'));
                        setTimeout(()=>{
                            console.log('再次获取');

                            if(connection.user_status==1){
                                connection.getWeibo(data)

                            }
                        },2000)

                    });
            }

            connection.getWeibo(data)
        }catch (e) {
            connection.sendUTF(JSON.stringify({ type:'webo_err',code: 200, message: "解析失败，可刷新重试"}));
        }


    }
};
module.exports = {
    getHomeWeibo:work.getHomeWeibo,
    overWeibo:function(connection){
        connection.user_status=0;
        connection.sendUTF(JSON.stringify({ type:'webo_err',code: 200, message: "已停止"}));
    }

};