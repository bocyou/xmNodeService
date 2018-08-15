'use strict';

class Player {
    constructor(opt) {
        let def = {
            autoplay: false
        };
        this.player = wx.createInnerAudioContext();

        this.opt = Object.assign(def, opt);//assign传入配置参数
        this.timer = null;

        this.init();
        this.watch();

    }

    init() {
        const self = this;
        this.player.startTime=0;
        this.player.autoplay = this.opt.autoplay;
        this.player.src = this.opt.url;

        this.timer = setInterval(() => {
            if (this.player.duration > 0) {
                clearInterval(this.timer);
                this.opt.duration(this.player.duration);
            }
        }, 200)


    }
    setStartTime(time){
        const self=this;
        let duration=this.player.duration;
        self.player.seek(Math.floor(time*duration ));

    }
 
    play() {

        this.player.play()
        console.log(  this.player.startTime);
    }

    pause() {
        this.player.pause();
    }

    stop() {
        this.player.stop();
    }

    watch() {
        this.player.onPlay(() => {
            this.opt.onPlay();
        });
        this.player.onTimeUpdate(() => {

            this.opt.onTimeUpdate(this.player.currentTime,this.player.duration);
        });
        this.player.onPause(() => {
            this.opt.onPause();
        });
        this.player.onStop(() => {
            this.opt.onStop();

        });
        this.player.onEnded(() => {
            this.opt.onEnded();
        });
        this.player.onError((res) => {
            console.log(res.errMsg);
            console.log(res.errCode);
        });
    }


}

export default Player