// pages/me/me.js
const util = require('../../utils/util.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    user_info:"",
    user_area:{"bj":"北京","nj":"南京","sh":"上海"}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self=this;
    util.request({
      url: util.api+'/api//get_current_user', param: '', complete: function (res) {
        //获取当前用户信息
        var data = res.data;
        if (data.code == 200 && JSON.stringify(data.result)!='{}') {
          self.setData({
            user_info: data.result
          });
        }else{
          console.log();
        }
      }
});


    this.setData({
      user_info: app.globalData.userInfo
  
    })

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
  
  }
})