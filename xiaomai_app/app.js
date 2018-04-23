//app.js
const util = require('utils/util.js');
App({
    onLaunch: function () {
        var self = this;
     /*   wx.getSystemInfo({
            success: function (res) {
                console.log(res);
                self.globalData.system_info=res;
            }
        })*/
      /*  wx.showModal({
            title: '',
            content: '获取刮奖列表失败，请检查您的网络状态并退出重试',
            success: function (res) {
                if (res.confirm) {
                } else if (res.cancel) {
                }
            }
        })*/

    },
    globalData: {
        userInfo: null,
        system_info:null
    }
})