//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
var session='';
Page({
  data: {
    motto: 'welcome to xiaomai',
    userInfo: {},
    hasUserInfo: false,
    screenInfo:false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    var self=this;
    util.getScreen(function(screenInfo){
      self.setData({
        screenInfo: screenInfo
      })
    });
    if (app.globalData.userInfo) {
     //说明获取到了用户信息
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        if(res!=false){
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
       
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },


  userLogin:function(){
    var self=this;
    wx.getSetting({

      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.login({
            success: function (res) {
              if (res.code) {
                //发起网络请求
                console.log();
                var param={};
                param.wx_code = res.code;
                wx.getUserInfo({
                  success: res => {
                    app.globalData.userInfo = res.userInfo;
                    param.userInfo = JSON.stringify(app.globalData.userInfo);
                    wx.request({
                      url: 'http://localhost:3000/api/user_login', //仅为示例，并非真实的接口地址
                      method: 'POST',
                      data: param,
                      header: {
                        'content-type': 'application/json', // 默认值

                      },
                      success: function (res) {
                        session = res.data.session;
                        //缓存后台传来的sessionKey
                        var userInfo = app.globalData.userInfo;
                        userInfo.session = res.data.session


                        wx.setStorageSync('userInfo', userInfo);

                        self.setData({
                          userInfo: userInfo,
                          hasUserInfo: true
                        })
                      }
                    })
                  }
                })
              } else {
                console.log('获取用户登录态失败！' + res.errMsg)
              }
            }
          });
        }else{
          wx.showModal({
            title: '',
            content: '检测到您没有打开小麦的用户信息权限，是否去设置打开？',
            success: function (res) {
              if (res.confirm) {
                wx.openSetting({
                  success: (res) => {
                    /*
                     * res.authSetting = {
                     *   "scope.userInfo": true,
                     *   "scope.userLocation": true
                     * }
                     */
                  }
                })
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
        }
        }
        })
   
   

   /* wx.login({
      success: function (res) {
        if (res.code) {
          //发起网络请求
          wx.request({
            url: 'http://localhost:3000/api/user_login', //仅为示例，并非真实的接口地址
            method: 'POST',
            data:{wx_code:res.code},
            header: {
              'content-type': 'application/json', // 默认值
             
            },
            success: function (res) {
             session=res.data.session;
            }
          })
        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });*/
  },
  getWxInfo: function () {
    wx.request({
      url: 'http://localhost:3000/api/get_wx_info', 
      method: 'POST',
      data: { session: session },
      header: {
        'content-type': 'application/json',// 默认值
        'cookie': 'sessionKey=' + session
      },
      success: function (res) {

      }
    })
  }

  
})
