import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxSuperMasonryComponent } from './ngx-super-masonry.component';

describe('NgxSuperMasonryComponent', () => {
  let component: NgxSuperMasonryComponent<any>;
  let fixture: ComponentFixture<NgxSuperMasonryComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxSuperMasonryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxSuperMasonryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
