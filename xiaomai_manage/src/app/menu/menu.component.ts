import { Component, OnInit } from '@angular/core';
import {Observable} from "rxjs";
import {FormControl} from "@angular/forms";
import 'rxjs/Rx';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  searchInput:FormControl=new FormControl();
  constructor() {
    Observable.from([{name:1},{name:2}])
      .filter(e => e.name == 1)
      .map(e => e)
      .subscribe(
        e => console.log(e),
        err =>console.log(err),
        () => console.log("over")
      );

    this.searchInput.valueChanges
      .debounceTime(500)
      .subscribe(userInput => this.getInputValue(userInput));
  }

  ngOnInit() {
  }
  doOnInput(event:any){
    console.log(event.target.value);
    console.log(event.target.getAttribute('name'));
  }
  getInputValue(value:string){
    console.log(value);
  }
}
