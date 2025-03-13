import { Component, OnInit, ViewChild } from '@angular/core';
import { MasonryItemComponent, MasonryOptions, NgxSuperMasonryComponent, LayoutEvent } from 'ngx-super-masonry';
import { CurrencyPipe, NgForOf, NgIf } from '@angular/common';
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
    AccordionModule,
    CurrencyPipe,
    NgIf
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild(NgxSuperMasonryComponent) masonry!: NgxSuperMasonryComponent<ImageItem>;

  // Display properties
  currentColumnCount = 0;
  containerWidth = 0;
  images: ImageItem[] = [];

  // Default masonry options
  masonryOptions: MasonryOptions<ImageItem> = {
    columns: 'auto',
    columnWidth: 200,
    gutterX: 5,
    gutterY: 5,
    animationDuration: 0
  };

  optionsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.optionsForm = this.fb.group({
      layout: this.fb.group({
        columnMode: ['auto'],
        columns: [4],
        columnWidth: [200],
        gutterX: [5],
        gutterY: [5]
      }),
      animation: this.fb.group({
        duration: [500],
        enabled: [false]
      }),
      filter: this.fb.group({
        sortEnabled: [false],
        sortDirection: ['desc'],
        filterEnabled: [false]
      })
    });
  }

  ngOnInit(): void {
    // Generate sample data
    this.images = this.generateImages(50);

    // Initialize options
    this.initOptionsSubscription();
  }

  onLayoutComplete(event: LayoutEvent): void {
    this.currentColumnCount = event.columns;
    this.containerWidth = event.containerWidth;
  }

  onImageLoad(item: ImageItem): void {
    item.imageLoaded = true;
    this.masonry.layout();
  }

  trackByFn(index: number, item: ImageItem): string {
    return `${item.id}-${index}`;
  }

  private generateImages(count: number): ImageItem[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      src: `https://picsum.photos/${this.getRandomInt(200, 800)}/${this.getRandomInt(200, 400)}?random=${index}`,
      imageLoaded: false,
      price: this.getRandomInt(0, 1000)
    }));
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private initOptionsSubscription(): void {
    this.optionsForm.valueChanges.subscribe(form => {
      // Build masonry options from form values
      const isAutoMode = form.layout.columnMode === 'auto';

      this.masonryOptions = {
        // Layout options
        columns: isAutoMode ? 'auto' : Number(form.layout.columns),
        columnWidth: Number(form.layout.columnWidth),
        gutterX: Number(form.layout.gutterX),
        gutterY: Number(form.layout.gutterY),

        // Animation options
        animationDuration: form.animation.enabled ? Number(form.animation.duration) : 0,

        // Filter and sort options
        filterFunction: form.filter.filterEnabled
          ? (items: MasonryItemComponent<ImageItem>[]) =>
            items.filter(item => item.data.price > 500)
          : undefined,

        sortFunction: form.filter.sortEnabled
          ? (items: MasonryItemComponent<ImageItem>[]) => {
            const multiplier = form.filter.sortDirection === 'asc' ? 1 : -1;
            return [...items].sort(
              (a, b) => (a.data.price - b.data.price) * multiplier
            );
          }
          : undefined
      };
    });
  }
}
