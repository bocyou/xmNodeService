const app=getApp();
import Request from 'request';
const {version} =require('config');
const ws_api ='wss://xiaomai.towords.com/wss';
const api ='https://xiaomai.towords.com/xm';
/* const api = 'http://192.168.2.128:8080/xm';
const ws_api = 'ws://192.168.2.128:8081'; */
function checkFunction(callback, data) {
    if (callback && typeof callback === 'function') {
        callback(data);
    }
}

const checkPermission = function (callback) {
    if (app.userInfo) {
        callback(app.userInfo);
    } else {
        const userInfo = wx.getStorageSync('userInfo');
        if(userInfo){
            callback(userInfo);
        }else{
            wx.redirectTo({url: '/pages/login/login'})
        }
    }
};


var getScreen = function (callBack) {

    wx.getSystemInfo({
        success: function (res) {
            callBack(res);
        }
    })

}


Date.prototype.Format = function (fmt) { //
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

const customDate = function (time, str) {
    if(str){
        return new Date(time).Format(str);

    }else{
        return new Date(time).Format('yyyy/MM/dd HH:mm')
    }
}

//需要权限（以后逐步使用此方法）
const requestAuth = function (opt) {
    const session = app.userInfo.session;
    if (session) {
        Request.post({
            params: opt.params,
            url: opt.url,
            session: session,
      
            success: (data) => {
                if (data.code === 200) {
                    checkFunction(opt.success, data.result)
                } else if (data.code === 502) {
                    wx.redirectTo({
                        url: '/pages/login/login'
                    });
                } else {
                    if (opt.success) {
                        wx.showToast({
                            title: opt.tip ? opt.tip : '获取数据失败',
                            icon:"none"
                        });
                    }

                }

            },
            complete: opt.complete

        });

    } else {
        wx.redirectTo({
            url: '/pages/login/login'
        })
    }
};
const request = function (opt) {
    let userInfo = wx.getStorageSync('userInfo');
    wx.request({
        url: opt.url,
        method: 'POST',
        data: opt.param,
        header: {
            'content-type': 'application/json', // 默认值
            'sessionkey': userInfo.session,
            'version': version
        },
        success: function (res) {

        },
        complete: function (res) {
            if (res.data.code == 502) {
                //没有session
                wx.redirectTo({
                    url: '/pages/login/login'
                })
            } else {
                opt.complete(res);
            }

        }
    })
}
var checkRepeat = function (obj, ary, objName, aryName) {

    var i = ary.length;
    var objStr = '';
    var aryStr = '';
    if (objName != '' && objName != undefined) {
        objStr = obj[objName];
    } else {
        objStr = obj;
    }
    while (i--) {
        if (aryName != '' && aryName != undefined) {
            aryStr = ary[i][aryName];
        } else {
            aryStr = ary[i];
        }
        if (objStr == aryStr) {
            return i
        }
    }
    return -1
}

var checkAuthorize = function () {
    wx.showModal({
        title: '提示',
        content: '由于您拒绝微信授权，所以无法使用该程序，请后台退出程序重新授权',
        success: function (res) {
            if (res.confirm) {
                console.log('用户点击确定');
                //返回首页
            } else if (res.cancel) {
                console.log('用户点击取消')
            }
        }
    })
}

const sec_to_time = function(s) {
    var t;
    if(s > -1){
        var hour = Math.floor(s/3600);
        var min = Math.floor(s/60) % 60;
        var sec = s % 60;
        if(hour < 10&&hour>0) {
            t = '0'+ hour + "小时";
        }else if(hour==0){
            t='';
        } else {
            t = hour + "小时";
        }

        if(min < 10){t += "0";}
        t += min + "分";
        if(sec < 10){t += "0";}
        t += sec.toFixed(0)+'秒';
    }
    return t;
};


module.exports = {
    customDate: customDate,
    getScreen: getScreen,
    request: request,
    checkRepeat: checkRepeat,
    api: api,
    ws_api: ws_api,
    checkPermission: checkPermission,
    requestAuth:requestAuth,
    sec_to_time:sec_to_time
}
