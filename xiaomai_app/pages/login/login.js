// pages/login/login.js
const app = getApp();
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
   userLogin: function () {
    var self = this;
     
          wx.login({
            success: function (res) {
              if (res.code) {
                //发起网络请求
         
                var param = {};
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
                        var data = res.data;
                        if (data.code == 200 &&data.result==-1){
                          //该用户尚未注册
                          wx.redirectTo({
                            url: '../signup/signup'
                          })
                        } else if (data.code == 200 && data.result==true){
                          //登录成功
                         
                          //缓存后台传来的sessionKey
                          var userInfo = app.globalData.userInfo;
                          userInfo.session = data.session
                          wx.setStorageSync('userInfo', userInfo);
                          wx.switchTab({
                            url: '../index/index'
                          })
                        }else{

                        }
                        
                      }
                    })
                  },
                  fail:function(res){
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
                })
              } else {
                console.log('获取用户登录态失败！' + res.errMsg)
              }
            }
          });
       
        
        
 
   
  }
})