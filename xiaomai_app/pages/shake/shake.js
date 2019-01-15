// pages/shake/shake.js
const { customDate, ws_api, requestAuth } = require('../../utils/util.js');
import player from '../../utils/player';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shake_num: 0,
    shake_status: -1,
    win_user: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.error = 0;
    this.player = new player();
    this.createSocket();
    this.shake();
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
    wx.closeSocket();
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
    self.session = userInfo.session;
    if (userInfo) {
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
          data: JSON.stringify({ type: 'get_shake_info' })
        });


      })
      wx.onSocketError(function (res) {
        self.error = 1;
        requestAuth({
          url: '/shake/get_shake_info',
          tip: '获取当期信息失败',
          success: (res) => {
            self.render_term_info(res);
            self.getWinUsers();
          }
        });
      })


      wx.onSocketMessage(function (res) {
        //监听WebSocket接受到服务器的消息事件
        //console.log(res);

        let data = JSON.parse(res.data);
        switch (data.type) {
          case 'error':
            wx.showToast({
              title: data.message,
              icon: 'none'
            });
            break;
          case 'current_term_info':
            self.render_term_info(data.result);
            break;
          case 'get_win_user':

              self.setData({
                win_user: data.result
              });
            break;

        }

      })

      wx.onSocketClose(function (res) {
        //监听关闭事件

      })
    }

  },
  render_term_info(data) {
    const self = this;
    self.setData({
      shake_status: data.status,
      shake_num: (data.shake_num - data.user_shake_num < 0 ? 0 : data.shake_num - data.user_shake_num)
    });
    if (data.status == 0) {
      wx.sendSocketMessage({
        data: JSON.stringify({ type: 'get_win_user', session: self.session })
      });
    }
  },
  update() {
    const self = this;
    if (self.data.shake_status == 1) {
      self.player.play('https://official-web.oss-cn-beijing.aliyuncs.com/mini_program/xiaomai/audio/shake.mp3');
      if (self.error === 0) {
        wx.sendSocketMessage({
          data: JSON.stringify({ type: 'update_shake_num', session: self.session })
        });
      } else {
        requestAuth({
          url: '/shake/update_shake_num',
          tip: '更新数据失败',
          success: (res) => {
            self.render_term_info(res);
            if (res.status === 0) {
              //要到数值，自动结束
              self.getWinUsers();
            }
          }
        });
      }

    }

  },
  getWinUsers() {
    const self = this;
    requestAuth({
      url: '/shake/get_win_users',
      tip: '获取中奖人员信息失败',
      success: (res) => {
        self.setData({
          win_user: res
        });
      }
    });
  },
  shake() {
    const self = this;
    let numX = 1 //x轴
    let numY = 1 // y轴
    let numZ = 0 // z轴
    let num = 0;
    wx.onAccelerometerChange(function (res) {
      if ((numX < res.x && numY < res.y) || (numZ < res.z && numY < res.y)) {
        self.update();

      }

    })
  }
})
