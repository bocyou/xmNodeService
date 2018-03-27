import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DinnerStatisticsComponent } from './dinner-statistics.component';

describe('DinnerStatisticsComponent', () => {
  let component: DinnerStatisticsComponent;
  let fixture: ComponentFixture<DinnerStatisticsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DinnerStatisticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DinnerStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
