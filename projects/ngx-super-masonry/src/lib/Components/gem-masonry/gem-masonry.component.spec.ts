import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GemMasonryComponent } from './gem-masonry.component';

describe('GemMasonryComponent', () => {
  let component: GemMasonryComponent;
  let fixture: ComponentFixture<GemMasonryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GemMasonryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GemMasonryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
