import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServingsScaler } from './servings-scaler';

describe('ServingsScaler', () => {
  let component: ServingsScaler;
  let fixture: ComponentFixture<ServingsScaler>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServingsScaler],
    }).compileComponents();

    fixture = TestBed.createComponent(ServingsScaler);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
