import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppBarMobile } from './title-bar-mobile';

describe('AppBarMobile', () => {
  let component: AppBarMobile;
  let fixture: ComponentFixture<AppBarMobile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppBarMobile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppBarMobile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
