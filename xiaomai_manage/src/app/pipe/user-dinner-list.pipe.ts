import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'userDinnerList'
})
export class UserDinnerListPipe implements PipeTransform {

  transform(value: any[], args?: any): any {

    return value.map(item =>{
      item.dinner_list=JSON.parse(decodeURIComponent(item.dinner_list));
      let sum=0;
      for(var i=0;i<item.dinner_list.length;i++){
        sum+=item.dinner_list[i].list.price;
      }
      item.sum=sum;
      return item;
    });
  }

}


