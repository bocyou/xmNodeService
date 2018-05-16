//index.js
//获取应用实例
const app = getApp();
const util = require('../../utils/util.js');
var session='';
Page({
  data: {
    screenInfo:false,
      is_dinner:false
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
          util.request({
              url: util.api+'/api/get_user_info', complete: function (res) {
                  var data = res.data;

                  if(data.code==200){
                      self.setData({
                          is_dinner: data.result.img
                      })

                  } else{


                  }
              }
          });

      });

  }

  
})
