// pages/shake/shake.js
const {customDate,ws_api} = require('../../utils/util.js');
import player from '../../utils/player';
Page({

  /**
   * 页面的初始数据
   */
  data: {
     shake_num:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.player=new player();
   this.shake();
   this.createSocket();
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
  createSocket: function () {
    const self = this;

    let userInfo = wx.getStorageSync('userInfo');
    self.session=userInfo.session;
    if(userInfo){
        wx.connectSocket({
            url: ws_api,
            data: {},
            header: {
                'content-type': 'application/json',
                'sessionkey': userInfo.session,
            },
            protocols: ['protocol1'],
            method: "GET",
            complete: function (res) {
            }
        })

        wx.onSocketOpen(function (res) {
            wx.sendSocketMessage({
                data: JSON.stringify({type:'get_shake_info'})
            });

        })

        wx.onSocketMessage(function (res) {
            //监听WebSocket接受到服务器的消息事件
            //console.log(res);

            let data = JSON.parse(res.data);
            switch (data.type) {
               case 'error':
                 wx.showToast({
                   title:data.message,
                   icon:'none'
                 });
               break;
               case 'current_term_info':
               console.log(data);
                 self.setData({
                  shake_num:data.result.user_shake_num
                 });
               break;

            }

        })

        wx.onSocketClose(function (res) {
            //监听关闭事件

            //console.log('WebSocket连接已关闭！')
        })
    }

},
update(){
  const self=this;
  this.player.play('https://official-web.oss-cn-beijing.aliyuncs.com/mini_program/xiaomai/audio/shake.mp3');
  wx.sendSocketMessage({
    data: JSON.stringify({type:'update_shake_num'})
});
},
  shake(){
    let numX = 1 //x轴
    let numY = 1 // y轴
    let numZ = 0 // z轴
    let num=0;
    wx.onAccelerometerChange(function (res) { 
      if ((numX < res.x && numY < res.y)||(numZ < res.z && numY < res.y)) {  
        console.log(num++);
    
      }
  
    })
  }
})
