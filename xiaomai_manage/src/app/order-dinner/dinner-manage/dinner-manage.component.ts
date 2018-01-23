import {Component, OnInit} from '@angular/core';
import {Http, Jsonp, Headers} from "@angular/http";
//使用rxjs
import {Observable} from "rxjs";
import 'rxjs/Rx';
@Component({
  selector: 'app-dinner-manage',
  templateUrl: './dinner-manage.component.html',
  styleUrls: ['./dinner-manage.component.css']
})
export class DinnerManageComponent implements OnInit {
  dataSource:Observable<any>;
  allList = [];
  start_txt='开启订餐';
  is_start=0;//尚未开启订餐
  weekMenu=[1,2,3,4,1,2,3];//配置每天默认的菜单0为周末
  currentKind = this.weekMenu[new Date().getDay()];//当前是什么菜单
  menuTitle = [
    {name: '西少爷', sort: 1, kind: 1},
    {name: '合利屋', sort: 2, kind: 2},
    {name: '煎饼', sort: 3, kind: 3},
    {name: '麦当劳', sort: 4, kind: 4}];

  constructor(private http:Http, private jsonp:Jsonp) {//构造函数

   this.getList();

  }

  ngOnInit() {
    //页面初始化
    /*    Observable.from(this.allList)
     .filter(e => e.name == 1)
     .map(e => e)
     .subscribe(
     e => console.log(e),
     err =>console.log(err),
     () => console.log("over")
     );*/

  }
  getList(){
    this.dataSource =
      this.http.post("/order_food/all_dinner_list", "")
        .map(response => response.json());
    this.dataSource.subscribe(
      data => {
        this.allList = data.result.list;
        this.is_start=data.result.is_start;
        if(this.is_start==0){
          this.start_txt='开启订餐';
        }else{
          this.start_txt='已开起订餐';
        }
      }
    )
  }

  startDinner(event:any) {
    //开始订餐
    console.log(event);
    if(this.is_start==0){
      //尚未开启订餐
      var list=this.allList.filter(item=>{

        return item.kind==this.currentKind
      });//过滤出当日订餐

      //编码url
      for(let item of list){
        item.img=encodeURIComponent(item.img);
      }
      var param={
        list:JSON.stringify(list)
      };
      console.log(param);

      this.http.post("/order_food/start_dinner", param)
        .map(response => response.json()).subscribe(
        data => {
          console.log(data);
          if(data.code==200&&data.result==true){
            alert('分发成功');
            this.getList();
          }else{
            alert('分发失败');
          }
        }
      );
    }else{
      alert('订餐已开始了，不能重复开始！');
    }


  }

  finishDinner(){
    //结束订餐
    this.http.post("/order_food/finish_dinner", "")
      .map(response => response.json()).subscribe(
      data => {
        if(data.result==true&&data.code==200){
          alert('已结束订餐');
        }else{
          alert('结束失败');
        }
        console.log(data);
      }
    );
  }

  selectMenu(menu:any) {
    this.currentKind=menu.kind;
  }

}


