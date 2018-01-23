import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dinnerListFilter',
})
export class DinnerFilterPipe implements PipeTransform {

  transform(list: any[], kind: string): any {

    return list.filter(item =>{
      let  itemValue=item.kind==kind;
      return itemValue;
    });
  }

}



