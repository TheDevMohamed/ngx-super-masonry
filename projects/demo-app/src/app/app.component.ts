import { Component, OnInit, ViewChild } from '@angular/core';
import { MasonryItemComponent, MasonryOptions, NgxSuperMasonryComponent } from 'ngx-super-masonry';
import { NgForOf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccordionModule } from 'ngx-bootstrap/accordion';

interface ImageItem {
  id: number;
  src: string;
  imageLoaded: boolean;
  price: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MasonryItemComponent,
    NgxSuperMasonryComponent,
    NgForOf,
    ReactiveFormsModule,
    AccordionModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  @ViewChild(NgxSuperMasonryComponent) masonry!: NgxSuperMasonryComponent<ImageItem>;

  masonryOptions: MasonryOptions<ImageItem> = {
    columns: 3,
    gutterX: 5,
    gutterY: 5,
    animationDuration: 100
  };

  images: ImageItem[] = [];

  optionsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.optionsForm = this.fb.group({
      layout: this.fb.group({
        columns: [3],
        gutterX: [5],
        gutterY: [5]
      }),
      animation: this.fb.group({
        duration: [100],
        enabled: [true]
      }),
      filter: this.fb.group({
        range: this.fb.group({
          min: [0],
          max: [1000]
        }),
        sortDirection: ['desc' as 'asc' | 'desc'],
        enableSort: [false]  // Add this control
      })
    });
  }

  onImageLoad(item: ImageItem) {
    item.imageLoaded = true;
  }

  ngOnInit() {
    this.images = this.generateImages(50);
    this.initOptionsSubscription();
  }

  private generateImages(count: number): ImageItem[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      src: `https://picsum.photos/${this.getRandomInt(200, 800)}/${this.getRandomInt(200, 400)}?random=${index}`,
      imageLoaded: false,
      price: this.getRandomInt(10, 1000)
    }));
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private initOptionsSubscription() {
    this.optionsForm?.valueChanges.subscribe(form => {
      if (!form.layout || !form.animation || !form.filter?.range || !form.filter.sortDirection) return;

      this.masonryOptions = {
        columns: form.layout.columns ?? 4,
        gutterX: form.layout.gutterX ?? 20,
        gutterY: form.layout.gutterY ?? 20,
        animationDuration: form.animation.enabled ? form.animation.duration : 0,
        searchConditions: [{
          property: 'price',
          value: [form.filter.range.min ?? 0, form.filter.range.max ?? 1000],
          matchMode: 'range',
          operator: 'AND'
        }],
        sortFunction: form.filter.enableSort ? (items: MasonryItemComponent<ImageItem>[]) => {
          const direction = form.filter?.sortDirection === 'asc' ? 1 : -1;
          return items.sort((a, b) => (a.data.price - b.data.price) * direction);
        } : undefined
      };
    });
  }

  trackByFn(index: number, item: ImageItem) {
    return `${item.id} - ${index}`;
  }
}
