// pages/year/year.js
const app = getApp();
const { requestAuth,customDate} = require('../../utils/util.js');
import NumberAnimate from "../../utils/number_animate";
Page({
  /**
   * 页面的初始数据
   */
  data: {
    long_time:'',
    dinner_list: [],
    dinner_sum: 0,
    dinner_all_money: 0,
    dinner_day0:[],
    draw_count: 0,
    draw_list: [],
    bet_list: 0,
    bet_win: [],
    shop_data: [],
    shop_money: 0,
    user_info:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getUserInfo();
  
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
   clearInterval(this.up_timer);
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
  upTime(){
    const self=this;
    self.up_timer=setInterval(()=>{
      const start_time='2018/04/18 10:00';
      const long_time=new Date().getTime()-new Date(start_time).getTime();
      self.setData({
        long_time:parseInt(long_time/1000)
      });
    },1000)
  },
  getUserInfo() {
    const self = this;
    requestAuth({
      url: '/api/get_current_user',
      tip: '获取用户信息失败',
      success: (res) => {
        const start_time='2018/04/18 10:00';
        const long_time=new Date().getTime()-new Date(start_time).getTime();
        let n =new NumberAnimate({
          from: parseInt(long_time/1000),
          speed: 1200,
          decimals: 0,
          refreshTime: 50,
          onUpdate: () => {
            self.setData({
              long_time:n.tempValue
            });
          },
          onComplete: () => {
             self.upTime();
          }
      });
    
      self.setData({
        user_info:res
      });
      self.getDinner();
      self.getDraw();
      self.getUserBet();
  
      self.getShopMoney();
      }
    });
  },
  getDinner() {
    const self = this;
    requestAuth({
      url: '/year/get_year_dinner',
      tip: '获取订餐数据失败',
      success: (res) => {
        self.setData({
          dinner_list: res.list.sort((a, b) => {
            return b.num - a.num;
          }).slice(0, 3),
          dinner_sum: res.all_num,
          dinner_all_money: res.all_money,
          dinner_day0:res.day0.map((item,idx)=>{
            item.dinner_list=JSON.parse(item.dinner_list);
            item.create_time=customDate(item.create_time)
            return item;
          })
        });
      }
    });
  },
  getDraw() {
    const self = this;
    requestAuth({
      url: '/year/get_year_draw',
      tip: '获取刮卡数据失败',
      success: (res) => {
        self.setData({
          draw_count: res.draw_count,
          draw_list: res.list
        });
      }
    });
  },
  getUserBet() {
    const self = this;
    requestAuth({
      url: '/year/get_year_user_bet',
      tip: '获取押注数据失败',
      success: (res) => {
        self.setData({
          bet_list: res.bet_data,
          bet_win: res.win_data
        })
      }
    });
  },

  getShopMoney() {
    const self = this;
    requestAuth({
      url: '/year/get_shop_money',
      tip: '获取小卖部消费数据失败',
      success: (res) => {
        let all_money = 0;
        res.forEach((item, idx) => {
          all_money += item.money * 10
        });
        self.setData({
          shop_data: res,
          shop_money: all_money / 10
        })
      }
    });
  }
})