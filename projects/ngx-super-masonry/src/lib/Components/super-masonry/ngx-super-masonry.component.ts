import {
  AfterContentInit,
  Component, computed, ContentChildren, effect,
  ElementRef, inject,
  Input, OnDestroy, QueryList, signal, ViewChild,
} from '@angular/core';
import {NgForOf, NgIf, NgOptimizedImage, NgTemplateOutlet} from '@angular/common';
import {MasonryItemComponent} from '../masonry-item/masonry-item.component';

// masonry.types.ts
export interface MasonryOptions {
  columns?: number | 'auto';
  columnWidth?: number;
  gutter?: number;
  horizontalOrder?: boolean;
  animationDuration?: number;
  breakpoints?: {
    [width: number]: Partial<MasonryOptions>;
  };
}

@Component({
  selector: 'lib-ngx-super-masonry',
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      width: 100%;
      /* Default values for CSS variables */
      --masonry-column-width: 200px;
      --masonry-gutter: 10px;
      --masonry-animation-duration: 300ms;
      --masonry-animation-timing: ease-out;
    }

  `
})
export class NgxSuperMasonryComponent implements AfterContentInit, OnDestroy {
  @Input() set options(value: MasonryOptions) {
    this._options.set(value);
    this.updateCSSVariables(value);
  }
  private layoutPending = false;
  private updateCSSVariables(options: MasonryOptions) {
    const el = this.elementRef.nativeElement;

    // Update CSS variables based on options
    if (options.columnWidth) {
      el.style.setProperty('--masonry-column-width', `${options.columnWidth}px`);
      el.style.setProperty('--masonry-column-width', `${options.columnWidth}px`);
    }
    if (options.gutter) {
      el.style.setProperty('--masonry-gutter', `${options.gutter}px`);
    }
    if (options.animationDuration) {
      el.style.setProperty('--masonry-animation-duration', `${options.animationDuration}ms`);
    }
  }

  @ContentChildren(MasonryItemComponent)
  items!: QueryList<MasonryItemComponent>;

  private readonly elementRef = inject(ElementRef);
  private readonly _options = signal<MasonryOptions>({
    columns: 'auto',
    gutter: 10,
    horizontalOrder: false,
    animationDuration: 100
  });

  private resizeObserver: ResizeObserver;
  private currentBreakpoint = signal<number | null>(null);

  private columns = computed(() => {
    const opts = this.getActiveOptions();
    if (opts.columns === 'auto') {
      const containerWidth = this.elementRef.nativeElement.offsetWidth;
      return Math.floor(
        (containerWidth + opts.gutter!) /
        (opts.columnWidth! + opts.gutter!)
      );
    }
    return opts.columns || 1;
  });

  constructor() {
    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.checkBreakpoint();
      this.layout();
    });

    // Set up effects
    effect(() => {
      this.applyLayout();
    });
  }
  private itemObservers: ResizeObserver[] = [];
  ngAfterContentInit() {
    // Existing container resize observer
    this.resizeObserver.observe(this.elementRef.nativeElement);

    // Handle dynamic changes to items
    this.items.changes.subscribe(() => {
      this.setupItemObservers();
      this.layout();
    });

    // Initial setup
    this.setupItemObservers();
    this.layout();
  }

  private setupItemObservers() {
    // Clean up any existing observers
    this.itemObservers.forEach(observer => observer.disconnect());
    this.itemObservers = [];

    // Set up an observer for each item
    this.items.forEach(item => {
      const observer = new ResizeObserver(() => {
        this.layout();
      });
      observer.observe(item.elementRef.nativeElement);
      this.itemObservers.push(observer);
    });
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
  }

  private checkBreakpoint() {
    const width = this.elementRef.nativeElement.offsetWidth;
    const breakpoints = this._options().breakpoints || {};
    const breakpointWidths = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => b - a);

    const newBreakpoint = breakpointWidths.find(bp => width <= bp) || null;
    if (newBreakpoint !== this.currentBreakpoint()) {
      this.currentBreakpoint.set(newBreakpoint);
    }
  }

  private getActiveOptions(): MasonryOptions {
    const baseOptions = this._options();
    const breakpoint = this.currentBreakpoint();
    if (breakpoint && baseOptions.breakpoints?.[breakpoint]) {
      return { ...baseOptions, ...baseOptions.breakpoints[breakpoint] };
    }
    return baseOptions;
  }

  private layout() {
    if (!this.layoutPending) {
      this.layoutPending = true;
      requestAnimationFrame(() => {
        this.doLayout();
        this.layoutPending = false;
      });
    }
  }

  private doLayout() {
    if (!this.items) return;

    const opts = this.getActiveOptions();
    const columnCount = this.columns();
    const columnHeights = new Array(columnCount).fill(0);
    const items = this.items.toArray();

    items.forEach(item => {
      const itemEl = item.elementRef.nativeElement;
      const columnIndex = this.getNextColumnIndex(columnHeights, opts);
      const x = (opts.columnWidth! + opts.gutter!) * columnIndex;
      const y = columnHeights[columnIndex];

      itemEl.style.transform = `translate(${x}px, ${y}px)`;
      columnHeights[columnIndex] += itemEl.offsetHeight + opts.gutter!;
    });

    this.elementRef.nativeElement.style.height = `${Math.max(...columnHeights)}px`;
  }

  private getNextColumnIndex(
    columnHeights: number[],
    options: MasonryOptions
  ): number {
    if (options.horizontalOrder) {
      return columnHeights.indexOf(Math.min(...columnHeights));
    }

    return columnHeights.reduce(
      (shortest, height, index) =>
        height < columnHeights[shortest] ? index : shortest,
      0
    );
  }

  private applyLayout() {
    requestAnimationFrame(() => {
      console.log("test");
      this.layout()
    });
  }
}
