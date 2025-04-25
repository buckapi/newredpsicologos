import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessionalDetailComponent } from './professional-detail.component';

describe('ProfessionalDetailComponent', () => {
  let component: ProfessionalDetailComponent;
  let fixture: ComponentFixture<ProfessionalDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessionalDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfessionalDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
