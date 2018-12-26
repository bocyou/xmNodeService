const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
const version = 1;

const ws_api ='wss://xiaomai.towords.com/wss';
const api ='https://xiaomai.towords.com/xm';
/*const api = 'http://localhost:8080/xm';
const ws_api = 'ws://localhost:8081';*/
//https://xiaomai.towords.com/xm
const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}

var checkPermission = function (callback) {
    var userInfo = wx.getStorageSync('userInfo');

    if (userInfo) {
        callback(userInfo);
        //获取当前用户数据
        /*      util.request({
                  url: util.api + '/api/check_current_user', complete: function (res) {
                      var data = res.data;
                      if (data.code == 200 && data.result == true) {

                      } else {
                          // 不存在
                          wx.redirectTo({url: '/pages/login/login'})
                      }
                  }
              })*/
    } else {
        console.log('跳到登录页面');
        wx.redirectTo({url: '/pages/login/login'})
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

const request = function (opt) {
    let userInfo = wx.getStorageSync('userInfo');
    wx.request({
        url: opt.url,
        method: 'POST',
        data: opt.param,
        header: {
            'content-type': 'application/json', // 默认值
            'sessionkey': userInfo.session,
            'v': version
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


module.exports = {
    customDate: customDate,
    formatTime: formatTime,
    getScreen: getScreen,
    request: request,
    checkRepeat: checkRepeat,
    api: api,
    ws_api: ws_api,
    checkPermission: checkPermission
}
