import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UseroverviewComponent } from './useroverview.component';

describe('UseroverviewComponent', () => {
  let component: UseroverviewComponent;
  let fixture: ComponentFixture<UseroverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UseroverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UseroverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
