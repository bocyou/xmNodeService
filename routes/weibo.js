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
    status:1,//表示开启递归0结束
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
          /*  console.log(error, body, JSON.stringify(response));*/
            if (!error && response.statusCode == 200) {
                connection.sendUTF(JSON.stringify({ type:'weibo_success',code: 200, message: "评论成功"}));
            }else{
                connection.sendUTF(JSON.stringify({ type:'webo_err',code: 200, message: "评论失败"}));
            }
        });
    },
    getHomeWeibo:function(connection,data){
        work.status=1;

        try{
            connection.last_update_time=0;
            console.log('开始获取微博信息');
            const cookie=data.cookie;
            connection.count_num=0;
            function getWeibo(data){
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
                        console.log(info_ary[0].update_time,connection.last_update_time);
                        if(connection.last_update_time===0){
                            //首次进入
                            connection.sendUTF(JSON.stringify({result: info_ary,num:connection.count_num++, type:'get_weibo_info',code: 200, message: "解析成功"}))
                            connection.last_update_time=info_ary[0].update_time;

                        }else{
                            if(info_ary[0].update_time!== connection.last_update_time){
                                if(info_ary[0].update_time>= connection.last_update_time){
                                    console.log('微博更新了');
                                    if(cookie){
                                        const formData=info_ary[0];
                                        work.comment( {
                                            "act": "post",
                                            "mid": formData.mid,
                                            "uid": formData.ouid,
                                            "forward": "0",
                                            "isroot": "0",
                                            "content": data.common_txt,
                                            "location": "page_100505_home",
                                            "module": "scommlist",
                                            "group_source": " ",
                                            "pdetail": formData.pdetail,
                                            "_t": "0"
                                        },cookie,connection)
                                    }
                                }else{
                                    console.log('微博删除了');
                                }
                                connection.sendUTF(JSON.stringify({result: info_ary,num:connection.count_num++, type:'get_weibo_info',code: 200, message: "解析成功"}));
                                connection.last_update_time=info_ary[0].update_time;
                            }

                        }
                        console.log('成功获取',new Date().Format('yyyy/MM/dd HH:mm:ss'));
                        setTimeout(()=>{
                            console.log('再次获取');

                            if(work.status==1){
                                getWeibo(data)

                            }
                        },1600)
                    });
            }
            getWeibo(data)
        }catch (e) {
            connection.sendUTF(JSON.stringify({ type:'webo_err',code: 200, message: "解析失败，可刷新重试"}));
        }


    }
};
module.exports = {
    getHomeWeibo:work.getHomeWeibo,
    overWeibo:function(connection){
        work.status=0;
        connection.sendUTF(JSON.stringify({ type:'webo_err',code: 200, message: "已停止"}));
    }

};