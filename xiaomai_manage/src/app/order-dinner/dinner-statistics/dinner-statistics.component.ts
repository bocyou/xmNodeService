import { Component, OnInit } from '@angular/core';
import {Http, Jsonp, Headers} from "@angular/http";
//使用rxjs
import {Observable} from "rxjs";
import 'rxjs/Rx';
@Component({
  selector: 'app-dinner-statistics',
  templateUrl: './dinner-statistics.component.html',
  styleUrls: ['./dinner-statistics.component.css']
})
export class DinnerStatisticsComponent implements OnInit {
  dataSource:Observable<any>;
  allList=[];
  today_list_all=[];
  sum_price=0;
  lucky_all_money=0;
  constructor(private http:Http, private jsonp:Jsonp) {//构造函数
    //获取订餐信息
    this.dataSource =
      this.http.post("/order_food/get_today_dinner", "")
        .map(response => response.json());

    this.http.post("/lucky_draw/sum_user_draw_money", "")
      .map(response => response.json()).subscribe(
      data => {
         console.log(data);
         if(data.code==200){
           this.lucky_all_money=data.result;
         }else{
           alert('获取刮刮卡数据失败');
         }

      }
    )


   //获取刮刮卡信息
  }

  ngOnInit() {
    this.dataSource.subscribe(
      data => {
        var self=this;
        if(JSON.stringify(data.result)=='{}'){
         // this.status=1;
        }else{
          this.allList = data.result.list_info;
          this.today_list_all=data.result.list_all;
          console.log(this.allList);
          //统计今天差价总数

          data.result.list_info.forEach(function(item,idx){
            var price=(item.dinner_list.sum_price-20);
            if(price-20<0){
              price=0;
            }
            self.sum_price+=price;
          })
        }
      }
    )
  }

}
