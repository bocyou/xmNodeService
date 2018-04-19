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

    },
    globalData: {
        userInfo: null,
        system_info:null
    }
})