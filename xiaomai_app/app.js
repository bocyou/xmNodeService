//app.js
const util = require('utils/util.js');
App({
  onLaunch: function () {
    var self = this;
    // 获取用户信息
    wx.getSetting({
      
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId\
              //取出缓存数据
              var userInfo = wx.getStorageSync('userInfo');
            //检查session是否过期
            wx.checkSession({
              success: function () {
                // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                // 所以此处加入 callback 以防止这种情况
                if (self.userInfoReadyCallback) {
                  self.userInfoReadyCallback(res)
                }
                //session 未过期，并且在本生命周期一直有效
                self.globalData.userInfo = res.userInfo;
                //检查当前用户是否合法
                util.request({
                  url: util.api+'/api/check_current_user', complete: function (res) {
                    var data = res.data;
                    if (data.code == 200 && data.result == true) {
                     //存在
                     /* wx.redirectTo({
                        url: 'pages/index/index'
                      })*/
                    } else {
                      // 不存在
                        console.log('不存在此用户');
                      wx.redirectTo({
                        url: '/pages/login/login'
                      })
                    }

                  }
                });
              
              },
              fail: function () {
                //登录态过期调用wx.login重新登录首页会自动检查如果没有获取到userInfo会自动进入登录页面
                if (self.userInfoReadyCallback) {
                  self.userInfoReadyCallback(false)
                }
                wx.redirectTo({
                  url: '/pages/login/login'
                })
                console.log('session已过期');
              }
              })
            
            }
          })
        }else{
            wx.redirectTo({
              url: '/pages/login/login'
                })
         console.log("没有授权");
        }
      }
    })
  },
  globalData: {
    userInfo: null
  }
})