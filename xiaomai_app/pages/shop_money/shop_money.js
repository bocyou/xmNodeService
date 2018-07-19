// pages/shop_money/shop_money.js
const util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
     money:-1,
      is_injection:0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
     console.log();
     var self=this;
     var money=options.money;
      wx.hideShareMenu();
     if(money>0){
         util.request({
             url: util.api+'/shop_money/save_shop_money',param:{money:money} ,complete: function (res) {
                 var data = res.data;
                 if(data.code==200){
                 if(data.is_injection){
                       self.setData({
                     is_injection:1,
                         money:money
                     });
                 }else{
                    self.setData({

                         money:money
                     });
                 }


                 }else{
                     self.setData({
                         money:-1
                     });

                 }


             }
         });
     }


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
    this.setData({
        money:0
    });

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