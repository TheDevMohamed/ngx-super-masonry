import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MasonryItemComponent, MasonryOptions, NgxSuperMasonryComponent, LayoutEvent } from 'ngx-super-masonry';
import { CurrencyPipe, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * Represents an item displayed in the masonry grid
 */
interface ImageItem {
  /** Unique identifier */
  id: number;
  /** Image source URL */
  src: string;
  /** Indicates if the image has been loaded */
  imageLoaded: boolean;
  /** Price value for filtering/sorting */
  price: number;
  /** Optional width for pre-allocation */
  width?: number;
  /** Optional height for pre-allocation */
  height?: number;
}

/**
 * Masonry Demo Application Component
 *
 * Demonstrates the features of the ngx-super-masonry library with
 * dynamic configuration controls and optimized rendering
 */
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
export class AppComponent implements OnInit, OnDestroy {
  /** Reference to the masonry component for direct interaction */
  @ViewChild(NgxSuperMasonryComponent) masonry!: NgxSuperMasonryComponent<ImageItem>;

  /** Current number of columns in the layout */
  currentColumnCount = 0;

  /** Current width of the container in pixels */
  containerWidth = 0;

  /** Array of image items to display in the grid */
  images: ImageItem[] = [];

  /** Configuration options for the masonry layout */
  masonryOptions: MasonryOptions<ImageItem> = {
    columns: 'auto',
    columnWidth: 200,
    gutterX: 5,
    gutterY: 5,
    animationDuration: 0
  };

  /** Form for dynamic configuration of masonry options */
  optionsForm: FormGroup;

  /** Used for efficient resize observation */
  private resizeObserver: ResizeObserver | null = null;

  /** Flag to track active resize operations */
  isResizing = false;

  /** Flag to track layout calculations in progress */
  private isCalculatingLayout = false;

  /** Time (ms) to throttle layout calculations */
  private layoutThrottleTime = 150;

  /** Subject for handling component destruction */
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    // Initialize the form structure
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

  /**
   * Lifecycle hook that runs after component initialization
   */
  ngOnInit(): void {
    // Generate sample data with randomized dimensions
    this.images = this.generateImages(50);

    // Setup option changes subscription
    this.initOptionsSubscription();

    // Setup optimized resize handling
    this.setupResizeHandling();
  }

  /**
   * Lifecycle hook that runs before component destruction
   */
  ngOnDestroy(): void {
    // Clean up observers and subscriptions
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Callback handler for when masonry has completed layout calculation
   */
  onLayoutComplete(event: LayoutEvent): void {
    // Track current layout metrics
    this.currentColumnCount = event.columns;
    this.containerWidth = event.containerWidth;
  }

  /**
   * Handler for image load events
   * Marks images as loaded but batches layout updates
   */
  onImageLoad(item: ImageItem): void {
    // Mark the image as loaded without triggering immediate layout
    if (!item.imageLoaded) {
      // Use requestAnimationFrame to batch DOM updates
      requestAnimationFrame(() => {
        item.imageLoaded = true;
      });
    }
  }

  /**
   * Track function for ngFor to improve rendering performance
   */
  trackByFn(index: number, item: ImageItem): number {
    return item.id;
  }

  /**
   * Generates an array of random test images
   */
  private generateImages(count: number): ImageItem[] {
    return Array.from({ length: count }, (_, index) => {
      // Pre-calculate dimensions to help browser allocate space
      const width = this.getRandomInt(200, 800);
      const height = this.getRandomInt(200, 400);

      return {
        id: index + 1,
        src: `https://picsum.photos/${width}/${height}?random=${index}`,
        imageLoaded: false,
        price: this.getRandomInt(0, 1000),
        width,
        height
      };
    });
  }

  /**
   * Helper to generate random integers within a range
   */
  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sets up subscription to form value changes
   */
  private initOptionsSubscription(): void {
    this.optionsForm.valueChanges
      .pipe(
        // Prevent memory leaks
        takeUntil(this.destroy$),
        // Optimize update frequency
        debounceTime(100)
      )
      .subscribe(form => {
        // Extract and normalize form values
        const isAutoMode = form.layout.columnMode === 'auto';

        // Create new options object
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

  /**
   * Sets up optimized resize handling to minimize re-flows
   */
  private setupResizeHandling(): void {
    // Handle window resize events with debounce
    fromEvent(window, 'resize')
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(this.layoutThrottleTime),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (!this.isResizing) {
          this.isResizing = true;

          // Use requestAnimationFrame to synchronize with browser painting
          requestAnimationFrame(() => {
            this.isResizing = false;
          });
        }
      });

    // For modern browsers, ResizeObserver is more efficient than resize event
    try {
      this.resizeObserver = new ResizeObserver(
        this.createThrottledCallback(() => {
          if (!this.isCalculatingLayout) {
            this.isCalculatingLayout = true;

            // Batch layout operations with requestAnimationFrame
            requestAnimationFrame(() => {
              this.isCalculatingLayout = false;
            });
          }
        }, this.layoutThrottleTime)
      );

      // Wait for the view to initialize before attaching observer
      setTimeout(() => {
        const container = document.querySelector('.col-md-6:last-child');
        if (container && this.resizeObserver) {
          this.resizeObserver.observe(container);
        }
      });
    } catch (e) {
      // Fallback for browsers that don't support ResizeObserver
      console.log('ResizeObserver not supported, using window resize event');
    }
  }

  /**
   * Creates a throttled callback function for resize handling
   */
  private createThrottledCallback(callback: () => void, delay: number) {
    let lastCall = 0;
    return () => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback();
      }
    };
  }

  /**
   * Handler for filtered items event
   */
  onItemsFiltered(items: MasonryItemComponent<ImageItem>[]): void {
    console.log(`Filtered to ${items.length} items: `, items );
    // Additional handling as needed
  }

  /**
   * Handler for sorted items event
   */
  onItemsSorted(items: MasonryItemComponent<ImageItem>[]): void {
    console.log('Items sorted: ', items);
    // Additional handling as needed
  }
}
