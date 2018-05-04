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
        if(wx.getUpdateManager){
            const updateManager = wx.getUpdateManager();

            updateManager.onCheckForUpdate(function (res) {
                // 请求完新版本信息的回调
                console.log(res.hasUpdate)
            });
            updateManager.onUpdateReady(function () {
                wx.showModal({
                    title: '更新提示',
                    content: '新版本已经准备好，是否重启应用？',
                    success: function (res) {
                        if (res.confirm) {
                            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                            updateManager.applyUpdate()
                        }
                    }
                })

            });
            updateManager.onUpdateFailed(function () {
                wx.showModal({
                    title: '下载提示',
                    content: '下载失败请关闭小程序重试',
                    success: function (res) {
                        if (res.confirm) {

                        }
                    }
                })
            })
        }else{
            /*  wx.showModal({
                  title: '提示',
                  content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
              })*/
        }

    },
    globalData: {
        userInfo: null,
        system_info:null
    }
})