// pages/fight_for_money/fight_for_money.js
const {customDate,ws_api,requestAuth} = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
     info:{}

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
     this.getData();
  },
  getData:function(){
     const self=this;
     requestAuth({
       url:'/fight_for_money/get_data',
       success:function(res){
          self.setData({
            info:res
          })
       }
     })

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