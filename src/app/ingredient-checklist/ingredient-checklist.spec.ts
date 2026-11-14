import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngredientChecklist } from './ingredient-checklist';

describe('IngredientChecklist', () => {
  let component: IngredientChecklist;
  let fixture: ComponentFixture<IngredientChecklist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientChecklist],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientChecklist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
