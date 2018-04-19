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
      util.checkPermission(function(userInfo){
          self.setData({
              userInfo: userInfo
          })
      });

  }

  
})
