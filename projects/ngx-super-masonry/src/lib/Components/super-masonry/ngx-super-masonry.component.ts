import {
  AfterContentInit,
  Component, computed, ContentChildren,
  ElementRef, inject,
  Input, OnDestroy, QueryList, signal,
} from '@angular/core';
import {MasonryItemComponent} from '../masonry-item/masonry-item.component';


export interface SearchCondition<T> {
  property: keyof T;
  value: any;
  matchMode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'range';
  operator?: 'AND' | 'OR';
}

// masonry.types.ts
export interface MasonryOptions<TData> {
  columns?: number | 'auto';
  columnWidth?: number;
  gutterX?: number;  // Horizontal gutter
  gutterY?: number;  // Vertical gutter
  animationDuration?: number;
  breakpoints?: {
    [width: number]: Partial<MasonryOptions<TData>>;
  };
  sortFunction?: (items: MasonryItemComponent<TData>[]) => MasonryItemComponent<TData>[];
  searchConditions?: SearchCondition<TData>[];
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
      box-sizing: border-box;
      /* Default values for CSS variables */
      --masonry-column-width: 200px;
      --masonry-gutter-x: 10px;
      --masonry-gutter-y: 10px;
      --masonry-animation-duration: 300ms;
      --masonry-animation-timing: ease-out;
    }

  `
})
export class NgxSuperMasonryComponent<TData> implements AfterContentInit, OnDestroy {
  @Input() set options(value: MasonryOptions<TData>) {
    this._options.set(value);
    this.updateCSSVariables(value);
    this.layout();
  }
  private layoutPending = false;
  private updateCSSVariables(options: MasonryOptions<TData>) {
    const el = this.elementRef.nativeElement;
    const columns = options.columns || 1;
    const gutterX = options.gutterX || 0;
    const gutterY = options.gutterY || 0;

    // @ts-ignore
    const columnWidthPercent = 100 / columns;
    // @ts-ignore
    const gutterPercent = (gutterX / columns);

    el.style.setProperty('--masonry-column-width', `calc(${columnWidthPercent}% - ${gutterPercent*2}px)`);
    el.style.setProperty('--masonry-gutter-x', `${gutterX}px`);
    el.style.setProperty('--masonry-gutter-y', `${gutterY}px`);
    if (options.animationDuration) {
      el.style.setProperty('--masonry-animation-duration', `${options.animationDuration}ms`);
    }
  }

  @ContentChildren(MasonryItemComponent)
  items!: QueryList<MasonryItemComponent<TData>>;

  private readonly elementRef = inject(ElementRef);
  private readonly _options = signal<MasonryOptions<TData>>({
    columns: 'auto',
    gutterX: 10,
    gutterY: 10,
    animationDuration: 100
  });

  private resizeObserver: ResizeObserver;
  private currentBreakpoint = signal<number | null>(null);

  private columns = computed(() => {
    const opts = this.getActiveOptions();
    if (opts.columns === 'auto') {
      const containerWidth = this.elementRef.nativeElement.offsetWidth;
      return Math.floor(
        (containerWidth + opts.gutterX!) /
        (opts.columnWidth! + opts.gutterX!)
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

  private getActiveOptions(): MasonryOptions<TData> {
    const baseOptions = this._options();
    const breakpoint = this.currentBreakpoint();
    if (breakpoint && baseOptions.breakpoints?.[breakpoint]) {
      return { ...baseOptions, ...baseOptions.breakpoints[breakpoint] };
    }
    return baseOptions;
  }

  public layout() {
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

    // First filter, then sort
    let items = this.filterItems(this.items.toArray(), opts);
    items = opts.sortFunction ? opts.sortFunction(items) : items;

    const gutterX = opts.gutterX || 0;
    const gutterY = opts.gutterY || 0;

    // Calculate container and column dimensions
    const containerWidth = this.elementRef.nativeElement.offsetWidth;
    const totalGutterWidth = gutterX * (columnCount - 1);
    const columnWidth = (containerWidth - totalGutterWidth) / columnCount;

    // Hide filtered-out items
    this.items.forEach(item => {
      const itemEl = item.elementRef.nativeElement;
      if (!items.includes(item)) {
        itemEl.style.display = 'none';
        return;
      }
      itemEl.style.display = '';
    });

    items.forEach((item, index) => {
      const itemEl = item.elementRef.nativeElement;
      const columnIndex = this.getNextColumnIndex(columnHeights);

      const x = columnIndex * (columnWidth + gutterX);
      const y = columnHeights[columnIndex];

      itemEl.style.transform = `translate(${x}px, ${y}px)`;
      itemEl.style.width = `${columnWidth}px`;

      columnHeights[columnIndex] += itemEl.offsetHeight;
      if (index < items.length - columnCount) {
        columnHeights[columnIndex] += gutterY;
      }
    });

    const maxHeight = Math.max(...columnHeights, 0);
    this.elementRef.nativeElement.style.height = `${maxHeight}px`;
  }

  private getNextColumnIndex(
    columnHeights: number[]
  ): number {
    return columnHeights.reduce(
      (shortest, height, index) =>
        height < columnHeights[shortest] ? index : shortest,
      0
    );
  }

  protected filterItems(
    items: MasonryItemComponent<TData>[],
    options: MasonryOptions<TData>
  ): MasonryItemComponent<TData>[] {
    if (!options.searchConditions?.length) return items;

    return items.filter(item => {
      return options.searchConditions!.reduce((result, condition, index) => {
        const itemValue = item.data[condition.property];
        const matches = this.matchesCondition(itemValue, condition);

        if (index === 0) return matches;
        return condition.operator === 'OR'
          ? result || matches
          : result && matches;
      }, true);
    });
  }

  private matchesCondition(value: any, condition: SearchCondition<TData>): boolean {
    const { matchMode, value: searchValue } = condition;

    switch (matchMode) {
      case 'exact':
        return value === searchValue;
      case 'contains':
        return String(value).toLowerCase().includes(String(searchValue).toLowerCase());
      case 'startsWith':
        return String(value).toLowerCase().startsWith(String(searchValue).toLowerCase());
      case 'endsWith':
        return String(value).toLowerCase().endsWith(String(searchValue).toLowerCase());
      case 'range':
        return Array.isArray(searchValue) &&
          value >= searchValue[0] &&
          value <= searchValue[1];
      default:
        return true;
    }
  }
}
