import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DinnerManageComponent } from './dinner-manage.component';

describe('DinnerManageComponent', () => {
  let component: DinnerManageComponent;
  let fixture: ComponentFixture<DinnerManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DinnerManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DinnerManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
