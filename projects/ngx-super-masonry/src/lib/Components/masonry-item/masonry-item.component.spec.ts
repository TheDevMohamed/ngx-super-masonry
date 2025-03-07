import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasonryItemComponent } from './masonry-item.component';

describe('MasonryItemComponent', () => {
  let component: MasonryItemComponent<any>;
  let fixture: ComponentFixture<MasonryItemComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasonryItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasonryItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
