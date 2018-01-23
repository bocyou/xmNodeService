// pages/cleaning/cleaning.js
const app = getApp();
const util = require('../../utils/util.js');
var userId='';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:{},
    isPost:false,//用于确定当前的状态
    workData:'',//每种状态对应的数据
    remainingTasks:[],//剩余任务
    myWork:[],//我的任务
    isAdmin:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self=this;
    var userInfo = wx.getStorageSync('userInfo');
 
    this.setData({
      userInfo: userInfo
    });

    util.request({
      url: 'http://localhost:3000/api//get_current_user', param: '', complete: function (res) {
        //获取当前用户信息
        var data=res.data;
        userId=data.result[0].id
        if (data.code == 200 && data.result[0].role=='admin'){
          self.setData({
            isAdmin: true
          });
        }
        util.request({
          url: 'http://localhost:3000/api/get_cleaning_list', param: '', complete: function (res) {
            //有分发任务

            var allData = res.data.result.cleaning_list,
              remainingTasks = [],
              myWork = [];
            if (allData.length > 0) {
              for (var i = 0; i < allData.length; i++) {
                allData[i].task_time = util.customDate(allData[i].task_time, 'MM/dd HH:mm');
                if (allData[i].status == 'yifenfa') {
                  //未领取
                  remainingTasks.push(allData[i]);
                } else {
                  //其余任务 
                
                  if (allData[i].receiver_id == userId) {
                    myWork.push(allData[i]);
                  }
                }
              }
            }
            self.setData({
              isPost: true,
              myWork: myWork,
              remainingTasks: remainingTasks
            });
          }
        });
      }
    });


  },
  drawWork:function(e){
    //领取任务
    var self=this;
    var id = e.target.dataset.id;
    var status = e.target.dataset.status;
    util.request({
      url: 'http://localhost:3000/api/draw_work_status', param: { work_id: id, status: status }, complete: function (res) {
      
        var data = res.data;

      }
    });

  },
  finishWork:function(e){
    var self=this;
    var id = e.target.dataset.id;
    var status = e.target.dataset.status;
    util.request({
      url: 'http://localhost:3000/api/pending_work_status', param: { work_id: id, status: status }, complete: function (res) {

        var data = res.data;

      }
    });
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