// pages/audio_course/audio_course.js
const util = require('../../utils/util.js');
import Player from "../../utils/player";

let player = null;
let disc=null;

function secChange(s) {
    let t;
    if (s > -1) {
        var hour = Math.floor(s / 3600);
        var min = Math.floor(s / 60) % 60;
        var sec = s % 60;
        if (hour < 10 && hour > 0) {
            t = '0' + hour + ":";
        } else if (hour == 0) {
            t = '';
        } else {
            t = hour + ":";
        }

        if (min < 10) {
            t += "0";
        }
        t += min + ":";
        if (sec < 10) {
            t += "0";
        }
        t += sec.toFixed(0);
    }
    return t;
}

class Disc {
    constructor(opt) {

        let def = {
            r: 100,
            time:10
        };
        this.timer=null;
        this.current_deg=0;
        this.opt = Object.assign(def, opt);
        this.ctx = null;
        this.cover=null;
        this.init();
    }

    init() {
        const self=this;
        this.ctx = wx.createCanvasContext(this.opt.id);

        wx.getImageInfo({
            src: 'https://xiaomai.towords.com/img/disc.jpg',
            header: {
                'content-type': 'application/x-www-form-urlencoded', // 默认值
            },
            fail:function(){
                wx.showModal({
                    title: '',
                    content:'下载专辑封面失败，请删除小程序重试' ,
                    success: function(res) {
                        if (res.confirm) {
                            console.log('用户点击确定')
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
            },
            success: function (res) {
              self.cover=res.path;
                self.draw();
            }
        })
    }
    draw(){
        const self=this;
        let ctx=this.ctx;
        let r=this.opt.r;
        let screen_w=this.opt.screen_w;
        ctx.setFillStyle('red');
        ctx.translate(screen_w/2,r);
        ctx.rotate(this.current_deg * Math.PI / 180);
      /*  ctx.arc(0, 0, r, 0, 2 * Math.PI);
        ctx.fill();*/
      /*  ctx.arc(0, 0, r, 0, 2 * Math.PI);
        ctx.clip();*/
        ctx.drawImage( self.cover, -r,-r,2*r,2*r);

        ctx.draw();

    }
    start(){
        clearInterval(this.timer);
        this.timer=setInterval(()=>{

            if(this.current_deg>=360){
                this.current_deg=0;
            }else{
                this.current_deg+=1;
            }
            this.draw();

        },this.opt.time)
    }
    pause(){
        clearInterval(this.timer);
    }

}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        playing: 0,
        is_show_audio: 1,
        progress_time: '00:00',
        total_time: '00:00',
        screen_info: {},
        progress_num:0,
        today_time:util.customDate(new Date(),'yyyy/MM/dd'),
    },

    /**
     * 生命周期函数--监听页面加载
     */

    onLoad: function (options) {
        const self = this;
        util.getScreen(function (screenInfo) {
            console.log(screenInfo);
         disc = new Disc({
                id: 'disc',
                screen_w:screenInfo.screenWidth
            });

            self.setData({
                screen_info: screenInfo
            })
        });
        let today = new Date().getDay();
        console.log(today);

        if (today == 0 || today == 6) {
           self.setData({is_show_audio:0});
        } else {
            let audio_title=util.customDate(new Date(),'yyyyMMdd');
            player = new Player({
                url: 'https://topschool-xiaomai.oss-cn-beijing.aliyuncs.com/lesson/'+audio_title+'.mp3',
                duration: ((duration) => {
                    self.setData({
                        total_time: secChange(duration)
                    })
                }),
                onTimeUpdate: ((currentTime,duration) => {
                    self.setData({
                        progress_time: secChange(currentTime),
                        progress_num:currentTime/duration*100
                    });

                }),
                onPlay: (() => {
                    console.log('开始播放');
                    self.setData({
                        playing: 1
                    });
                    disc.start();
                }),
                onPause: (() => {
                    self.audioStop()
                }),
                onStop: (() => {
                    self.audioStop()
                }),
                onEnded: (() => {
                  self.audioStop()
                }),
            });
        }


    },
    audioStop:function(){
        const self=this;
        self.setData({
            playing: 0
        })
        disc.pause();
    },
    progressChange:function(e){
        const self=this;
        let ratio =e.detail.value/100;
        player.setStartTime(ratio);
        player.play();

    },
    stop_progress:function(){
        player.stop()
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
    playBtn: function () {
        const self = this;
        if (self.data.playing == 1) {
            player.pause()
        } else {
            player.play()
        }

    }
})