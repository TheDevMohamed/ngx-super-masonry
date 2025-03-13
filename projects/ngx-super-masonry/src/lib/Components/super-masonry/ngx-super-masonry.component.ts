import {
  AfterContentInit,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  QueryList,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { MasonryItemComponent } from '../masonry-item/masonry-item.component';

/**
 * Configuration options for masonry grid layout filtering
 */
export interface MasonryOptions<TData> {
  /** Number of columns or 'auto' for responsive layout */
  columns?: number | 'auto';
  /** Width of each column when using 'auto' columns */
  columnWidth?: number;
  /** Horizontal spacing between items */
  gutterX?: number;
  /** Vertical spacing between items */
  gutterY?: number;
  /** Animation duration in milliseconds (0 for no animation) */
  animationDuration?: number;
  /** Responsive breakpoints for different screen sizes */
  breakpoints?: {
    [width: number]: Partial<MasonryOptions<TData>>;
  };
  /** Function to sort items */
  sortFunction?: (items: MasonryItemComponent<TData>[]) => MasonryItemComponent<TData>[];
  /** Function to filter items */
  filterFunction?: (items: MasonryItemComponent<TData>[]) => MasonryItemComponent<TData>[];
}

/**
 * Information about layout operations
 */
export interface LayoutEvent {
  /** Time taken to complete layout operation (ms) */
  duration: number;
  /** Number of items laid out */
  itemCount: number;
  /** Number of columns in the layout */
  columns: number;
  /** Container width */
  containerWidth: number;
}

@Component({
  selector: 'lib-ngx-super-masonry',
  template: '<ng-content></ng-content>',
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      --masonry-column-width: 200px;
      --masonry-gutter-x: 10px;
      --masonry-gutter-y: 10px;
      --masonry-animation-duration: 300ms;
      --masonry-animation-timing: ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxSuperMasonryComponent<TData> implements AfterContentInit, OnDestroy {
  /**
   * Set masonry layout options
   * @param value The masonry options object
   */
  @Input() set options(value: MasonryOptions<TData>) {
    this._options.set(value);
    this.updateCSSVariables(value);
    this.scheduleLayout();
  }

  /**
   * Emits when layout is complete
   */
  @Output() layoutComplete = new EventEmitter<LayoutEvent>();
  @Output() itemsFiltered = new EventEmitter<MasonryItemComponent<any>[]>();
  @Output() itemsSorted = new EventEmitter<MasonryItemComponent<any>[]>();
  /** Collection of items to layout */
  @ContentChildren(MasonryItemComponent)
  items!: QueryList<MasonryItemComponent<TData>>;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly _options = signal<MasonryOptions<TData>>({
    columns: 'auto',
    columnWidth: 200,
    gutterX: 10,
    gutterY: 10,
    animationDuration: 100
  });

  // Track container width to force re-computation on resize
  private containerWidth = signal<number>(0);
  private resizeObserver: ResizeObserver;
  private itemObservers: ResizeObserver[] = [];
  private layoutPending = false;
  private currentBreakpoint = signal<number | null>(null);
  private itemsChangesSubscription: any;

  // Calculate columns based on options and container width
  private columns = computed(() => {
    const opts = this.getActiveOptions();
    const width = this.containerWidth();

    // Auto calculate columns based on container width and column width
    if (opts.columns === 'auto') {
      const gutterX = opts.gutterX || 0;
      const columnWidth = opts.columnWidth || 200;

      if (width <= 0) return 1;

      const calculatedColumns = Math.floor(
        (width + gutterX) / (columnWidth + gutterX)
      );

      return Math.max(1, calculatedColumns);
    }

    // Use specified columns or default to 1
    return Math.max(1, opts.columns || 1);
  });

  constructor() {
    this.resizeObserver = new ResizeObserver(() => {
      // Update width signal when container resizes
      const width = this.elementRef.nativeElement.offsetWidth;
      this.containerWidth.set(width);

      // Check if breakpoint changed
      this.checkBreakpoint();

      // Schedule layout with new dimensions
      this.scheduleLayout();
    });
  }

  ngAfterContentInit(): void {
    // Set initial container width
    this.containerWidth.set(this.elementRef.nativeElement.offsetWidth);

    // Observe container size changes
    this.resizeObserver.observe(this.elementRef.nativeElement);

    // Handle dynamic changes to items
    this.itemsChangesSubscription = this.items.changes.subscribe(() => {
      this.setupItemObservers();
      this.scheduleLayout();
    });

    // Initial setup
    this.setupItemObservers();
    this.scheduleLayout();
  }

  ngOnDestroy(): void {
    this.resizeObserver.disconnect();
    this.cleanupItemObservers();

    if (this.itemsChangesSubscription) {
      this.itemsChangesSubscription.unsubscribe();
    }
  }

  /**
   * Force a re-layout of the masonry grid
   */
  public layout(): void {
    this.scheduleLayout();
  }

  // Update CSS variables used by child components
  private updateCSSVariables(options: MasonryOptions<TData>): void {
    const el = this.elementRef.nativeElement;
    const columns = options.columns || 1;
    const gutterX = options.gutterX || 0;
    const gutterY = options.gutterY || 0;

    // Update column width CSS variable
    if (typeof columns === 'number') {
      const columnWidthPercent = 100 / columns;
      const gutterPercent = (gutterX / columns);
      el.style.setProperty('--masonry-column-width', `calc(${columnWidthPercent}% - ${gutterPercent * 2}px)`);
    }

    el.style.setProperty('--masonry-gutter-x', `${gutterX}px`);
    el.style.setProperty('--masonry-gutter-y', `${gutterY}px`);

    if (options.animationDuration !== undefined) {
      el.style.setProperty('--masonry-animation-duration', `${options.animationDuration}ms`);
    }
  }

  // Determine which breakpoint is active based on container width
  private checkBreakpoint(): void {
    const width = this.elementRef.nativeElement.offsetWidth;
    const breakpoints = this._options().breakpoints || {};

    // Sort breakpoints in descending order
    const breakpointWidths = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => b - a);

    // Find first breakpoint where width is less than or equal to breakpoint width
    const newBreakpoint = breakpointWidths.find(bp => width <= bp) || null;

    if (newBreakpoint !== this.currentBreakpoint()) {
      this.currentBreakpoint.set(newBreakpoint);
    }
  }

  // Get the active options considering breakpoints
  private getActiveOptions(): MasonryOptions<TData> {
    const baseOptions = this._options();
    const breakpoint = this.currentBreakpoint();

    if (breakpoint !== null && baseOptions.breakpoints?.[breakpoint]) {
      return { ...baseOptions, ...baseOptions.breakpoints[breakpoint] };
    }

    return baseOptions;
  }

  // Set up observers to detect item size changes
  private setupItemObservers(): void {
    this.cleanupItemObservers();

    this.items?.forEach(item => {
      if (!item.elementRef?.nativeElement) return;

      const observer = new ResizeObserver(() => this.scheduleLayout());
      observer.observe(item.elementRef.nativeElement);
      this.itemObservers.push(observer);
    });
  }

  // Clean up all item resize observers
  private cleanupItemObservers(): void {
    this.itemObservers.forEach(observer => observer.disconnect());
    this.itemObservers = [];
  }

  // Schedule layout with requestAnimationFrame for performance
  private scheduleLayout(): void {
    if (!this.layoutPending) {
      this.layoutPending = true;
      requestAnimationFrame(() => {
        const startTime = performance.now();
        this.doLayout();
        this.layoutPending = false;

        const duration = performance.now() - startTime;
        this.layoutComplete.emit({
          duration,
          itemCount: this.items?.length || 0,
          columns: this.columns(),
          containerWidth: this.containerWidth()
        });
      });
    }
  }

  // Perform the actual layout calculation
  private doLayout(): void {
    if (!this.items?.length) return;

    const opts = this.getActiveOptions();
    const columnCount = this.columns();
    const columnHeights = new Array(columnCount).fill(0);

    // Apply filtering and sorting
    const visibleItems = this.getVisibleItems(this.items.toArray(), opts);
    if (!visibleItems.length) return;

    // Calculate layout dimensions
    const containerWidth = this.containerWidth();
    const gutterX = opts.gutterX || 0;
    const gutterY = opts.gutterY || 0;
    const totalGutterWidth = gutterX * (columnCount - 1);
    const columnWidth = (containerWidth - totalGutterWidth) / columnCount;

    // Update item visibility
    this.updateItemsVisibility(visibleItems);

    // Position visible items
    visibleItems.forEach((item, index) => {
      const itemEl = item.elementRef.nativeElement;
      const columnIndex = this.getShortestColumnIndex(columnHeights);

      const x = columnIndex * (columnWidth + gutterX);
      const y = columnHeights[columnIndex];

      // Position the item
      itemEl.style.transform = `translate(${x}px, ${y}px)`;
      itemEl.style.width = `${columnWidth}px`;

      // Update column height
      columnHeights[columnIndex] += itemEl.offsetHeight;

      // Add gutter except after last row's items
      if (index < visibleItems.length - columnCount) {
        columnHeights[columnIndex] += gutterY;
      }
    });

    // Update container height
    const maxHeight = Math.max(...columnHeights, 0);
    this.elementRef.nativeElement.style.height = `${maxHeight}px`;
  }

  // Get visible items after filtering and sorting
  private getVisibleItems(
    items: MasonryItemComponent<TData>[],
    options: MasonryOptions<TData>
  ): MasonryItemComponent<TData>[] {
    // Apply filter function if provided
    let visibleItems;
    if (options.filterFunction) {
      visibleItems = options.filterFunction(items);
      this.itemsFiltered.emit(visibleItems); // Emit the filtered items
    } else {
      visibleItems = items;
    }

    if (options.sortFunction) {
      const sortedVisibleItems = options.sortFunction(visibleItems);
      this.itemsSorted.emit(sortedVisibleItems); // Emit the sorted items
      return sortedVisibleItems;
    } else {
      return visibleItems;
    }
  }

  // Update display property of items based on visibility
  private updateItemsVisibility(visibleItems: MasonryItemComponent<TData>[]): void {
    this.items.forEach(item => {
      const isVisible = visibleItems.includes(item);
      item.elementRef.nativeElement.style.display = isVisible ? '' : 'none';
    });
  }

  // Find the column with the shortest height
  private getShortestColumnIndex(columnHeights: number[]): number {
    return columnHeights.reduce(
      (shortestIdx, height, idx) =>
        height < columnHeights[shortestIdx] ? idx : shortestIdx,
      0
    );
  }
}
