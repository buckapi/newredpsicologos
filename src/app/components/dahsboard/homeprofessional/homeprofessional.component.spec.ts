import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeprofessionalComponent } from './homeprofessional.component';

describe('HomeprofessionalComponent', () => {
  let component: HomeprofessionalComponent;
  let fixture: ComponentFixture<HomeprofessionalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeprofessionalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeprofessionalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
