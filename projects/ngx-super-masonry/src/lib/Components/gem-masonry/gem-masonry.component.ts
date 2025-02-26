import {
  AfterContentInit,
  Component,
  ContentChildren,
  DestroyRef,
  effect,
  ElementRef,
  HostBinding,
  inject,
  Input,
  NgZone,
  OnDestroy,
  Output,
  QueryList,
  signal,
  EventEmitter,
  computed,
} from '@angular/core';
import { NgForOf, NgIf, NgTemplateOutlet, NgStyle } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MasonryItemComponent } from '../masonry-item/masonry-item.component';
import { fromEvent, Subject, debounceTime, throttleTime, animationFrameScheduler } from 'rxjs';

// Types from masonry.types.ts (assumed unchanged from your input)
export interface MasonryOptionsGem {
  columns?: number | 'auto';
  columnWidth?: number;
  gutter?: number;
  horizontalOrder?: boolean;
  fitWidth?: boolean;
  horizontalGutter?: number;
  verticalGutter?: number;
  percentPosition?: boolean;
  originLeft?: boolean;
  originTop?: boolean;
  animationEnabled?: boolean;
  animationDuration?: number;
  animationTimingFunction?: string;
  stagger?: number;
  transitionEffect?: 'fade' | 'scale' | 'slide' | 'none';
  lazyLoad?: boolean;
  lazyLoadThreshold?: number;
  initialFilter?: string | ((item: MasonryItemComponent) => boolean);
  breakpoints?: { [width: number]: Partial<MasonryOptionsGem> };
  itemSelector?: string;
  stamp?: string;
  containerStyle?: { [key: string]: string };
  useImagesLoaded?: boolean;
  waitForTransition?: boolean;
  equalHeight?: boolean;
  pack?: 'justified' | 'packed' | 'cascade';
  infiniteScroll?: boolean;
  infiniteScrollThreshold?: number;
  infiniteScrollBatchSize?: number;
  draggable?: boolean;
  virtualize?: boolean;
  virtualizeBuffer?: number;
}

export interface MasonryEvents {
  beforeLayout: void;
  layoutComplete: MasonryItemComponent[];
  removeComplete: MasonryItemComponent[];
  imageLoaded: { img: HTMLImageElement; item: MasonryItemComponent };
  itemClick: { event: Event; item: MasonryItemComponent };
  itemHover: { event: Event; item: MasonryItemComponent };
  filterComplete: MasonryItemComponent[];
  infiniteScroll: void;
  error: Error;
}

export type MasonryFilter = string | ((item: MasonryItemComponent) => boolean);

@Component({
  selector: 'lib-ngx-gem-masonry',
  standalone: true,
  imports: [NgIf, NgStyle, NgForOf, NgTemplateOutlet],
  template: `
    <div
      class="masonry-overlay"
      *ngIf="showPlaceholders() && !itemsReady()"
      [ngStyle]="{'height': placeholderHeight + 'px'}">
      <div
        class="masonry-placeholder"
        *ngFor="let i of placeholdersArray()"
        [ngStyle]="getPlaceholderStyle()">
        <div class="masonry-placeholder-animation"></div>
      </div>
    </div>

    <div class="masonry-sizer" *ngIf="percentPosition()"></div>
    <div class="masonry-gutter-sizer" *ngIf="percentPosition()"></div>

    <ng-content></ng-content>

    <div class="masonry-loader" *ngIf="loading()">
      <ng-container *ngTemplateOutlet="loaderTemplate || defaultLoader"></ng-container>
    </div>

    <ng-template #defaultLoader>
      <div class="masonry-default-loader">
        <div class="masonry-loader-spinner"></div>
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      width: 100%;
      min-height: 50px;
      overflow: hidden;
      --masonry-column-width: 200px;
      --masonry-gutter: 10px;
      --masonry-horizontal-gutter: var(--masonry-gutter);
      --masonry-vertical-gutter: var(--masonry-gutter);
      --masonry-animation-duration: 300ms;
      --masonry-animation-timing: ease-out;
      --masonry-stagger-delay: 50ms;
      --masonry-background: transparent;
      --masonry-placeholder-background: #f0f0f0;
      --masonry-placeholder-animation-background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
    }

    .masonry-sizer, .masonry-gutter-sizer {
      position: absolute;
      visibility: hidden;
    }

    .masonry-sizer {
      width: var(--masonry-column-width);
    }

    .masonry-gutter-sizer {
      width: var(--masonry-gutter)
    }

    .masonry-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      flex-wrap: wrap;
      gap: var(--masonry-gutter);
      padding: var(--masonry-gutter);
    }

    .masonry-placeholder {
      position: relative;
      background-color: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .masonry-placeholder-animation {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
      animation: shimmer 1.5s infinite;
    }

    .masonry-loader {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
    }

    .masonry-default-loader {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .masonry-loader-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    :host ::ng-deep .masonry-item {
      position: absolute;
      transition: transform var(--masonry-animation-duration) var(--masonry-animation-timing);
      will-change: transform;
    }

    :host ::ng-deep .masonry-item.fade-in {
      opacity: 0;
      animation: fadeIn var(--masonry-animation-duration) forwards;
    }

    :host ::ng-deep .masonry-item.scale-in {
      opacity: 0;
      transform: scale(0.8);
      animation: scaleIn var(--masonry-animation-duration) forwards;
    }

    :host ::ng-deep .masonry-item.slide-in {
      opacity: 0;
      transform: translateY(50px);
      animation: slideIn var(--masonry-animation-duration) forwards;
    }

    @keyframes fadeIn {
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes slideIn {
      to { opacity: 1; transform: translateY(0); }
    }
  `,
})
export class NgxGemMasonryComponent implements AfterContentInit, OnDestroy {
  // Inputs
  @Input() set options(value: MasonryOptionsGem) {
    this._options.set({ ...this.defaultOptions, ...value });
    this.updateCSSVariables(this._options());
    this.layout();
  }
  @Input() loaderTemplate?: any;
  @Input() placeholderCount = 10;
  @Input() placeholderHeight = 500;
  @Input() itemClassName = '';

  // Outputs
  @Output() beforeLayout = new EventEmitter<void>();
  @Output() layoutComplete = new EventEmitter<MasonryItemComponent[]>();
  @Output() removeComplete = new EventEmitter<MasonryItemComponent[]>();
  @Output() imageLoaded = new EventEmitter<{ img: HTMLImageElement; item: MasonryItemComponent }>();
  @Output() itemClick = new EventEmitter<{ event: Event; item: MasonryItemComponent }>();
  @Output() itemHover = new EventEmitter<{ event: Event; item: MasonryItemComponent }>();
  @Output() filterComplete = new EventEmitter<MasonryItemComponent[]>();
  @Output() infiniteScrollEvent = new EventEmitter<void>();
  @Output() error = new EventEmitter<Error>();

  // Content children
  @ContentChildren(MasonryItemComponent, { descendants: true })
  items!: QueryList<MasonryItemComponent>;

  // Injections
  private readonly elementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  // Signals
  // @ts-ignore
  private readonly _options = signal<MasonryOptionsGem>(this.defaultOptions);
  private readonly _filter = signal<MasonryFilter | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly itemsReady = signal<boolean>(false);
  protected readonly showPlaceholders = signal<boolean>(true);
  protected readonly percentPosition = signal<boolean>(false);
  private readonly scrollSubject = new Subject<void>();
  private isLoadingMore = false;

  // Computed properties
  private readonly columns = computed(() => {
    const opts = this.getActiveOptions();
    if (opts.columns === 'auto') {
      const containerWidth = this.elementRef.nativeElement.offsetWidth;
      const columnWidth = opts.columnWidth || 200;
      const gutter = this.getHorizontalGutter();
      return Math.max(1, Math.floor((containerWidth + gutter) / (columnWidth + gutter)));
    }
    return opts.columns || 1;
  });

  public readonly placeholdersArray = computed(() =>
    Array.from({ length: Math.min(this.placeholderCount, this.columns() * 3) })
  );

  // Host bindings
  @HostBinding('class.is-loading') get isLoading() {
    return this.loading();
  }
  @HostBinding('class.has-animations') get hasAnimations() {
    return this.getActiveOptions().animationEnabled;
  }

  // Default options
  private readonly defaultOptions: MasonryOptionsGem = {
    columns: 'auto',
    columnWidth: 200,
    gutter: 10,
    horizontalOrder: false,
    fitWidth: false,
    percentPosition: false,
    originLeft: true,
    originTop: true,
    animationEnabled: true,
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    stagger: 50,
    transitionEffect: 'fade',
    lazyLoad: false,
    lazyLoadThreshold: 300,
    initialFilter: undefined,
    useImagesLoaded: true,
    waitForTransition: true,
    equalHeight: false,
    pack: 'justified',
    infiniteScroll: false,
    infiniteScrollThreshold: 200,
    infiniteScrollBatchSize: 10,
    draggable: false,
    virtualize: false,
    virtualizeBuffer: 5,
  };

  // Observers
  private resizeObserver!: ResizeObserver;

  constructor() {
    this._options.set(this.defaultOptions);

    effect(() => {
      const filter = this._filter();
      if (filter !== null && this.items) {
        this.applyFilter(filter);
      }
      const activeOptions = this.getActiveOptions();
      this.percentPosition.set(!!activeOptions.percentPosition);
    });

    this.setupInfiniteScroll();
  }

  private setupInfiniteScroll() {
    this.scrollSubject.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(200)).subscribe(() => {
      this.checkBottomReached();
    });
  }

  ngAfterContentInit() {
    this.setupResizeObserver();

    this.loading.set(true);
    this.showPlaceholders.set(true);

    this.items.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.setupItemListeners();
      this.layout();
    });

    const initialFilter = this._options().initialFilter;
    if (initialFilter) {
      this._filter.set(initialFilter);
    }

    this.setupItemListeners();

    setTimeout(() => {
      this.itemsReady.set(true);
      this.showPlaceholders.set(false);
      this.loading.set(false);
      this.layout();
    }, 100);

    this.ngZone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(throttleTime(100, animationFrameScheduler), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.ngZone.run(() => this.layout()));
      fromEvent(window, 'scroll')
        .pipe(throttleTime(100, animationFrameScheduler), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.ngZone.run(() => this.scrollSubject.next()));
    });
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  // Public API methods
  public layout(animate = true): void {
    if (!this.items || this.items.length === 0) return;

    this.beforeLayout.emit();

    try {
      if (this.getActiveOptions().useImagesLoaded) {
        this.waitForImages().then(() => this.executeLayout(animate));
      } else {
        this.executeLayout(animate);
      }
    } catch (err) {
      this.error.emit(err as Error);
    }
  }

  public filter(filter: MasonryFilter): void {
    this._filter.set(filter);
  }

  public resetFilter(): void {
    this._filter.set(null);
  }

  public getPlaceholderStyle(): { [key: string]: string } {
    const activeOptions = this.getActiveOptions();
    const columnWidth = this.getColumnWidthPx();
    return {
      width: `${columnWidth}px`,
      height: `${Math.floor(100 + Math.random() * 150)}px`,
    };
  }

  // Private methods
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => this.layout(false));
    });
    this.resizeObserver.observe(this.elementRef.nativeElement);
  }

  private setupItemListeners(): void {
    if (!this.items) return;
    this.items.forEach((item) => {
      const el = item.elementRef.nativeElement;
      el.classList.add('masonry-item');
      if (this.itemClassName) {
        el.classList.add(this.itemClassName);
      }
      el.addEventListener('click', (event: MouseEvent) =>
        this.ngZone.run(() => this.itemClick.emit({ event, item }))
      );
      el.addEventListener('mouseenter', (event: MouseEvent) =>
        this.ngZone.run(() => this.itemHover.emit({ event, item }))
      );
    });
  }

  private getActiveOptions(): MasonryOptionsGem {
    return this._options();
  }

  private updateCSSVariables(options: MasonryOptionsGem): void {
    const el = this.elementRef.nativeElement;
    if (options.columnWidth) {
      el.style.setProperty('--masonry-column-width', `${options.columnWidth}px`);
    }
    const gutter = this.getHorizontalGutter();
    el.style.setProperty('--masonry-gutter', `${gutter}px`);
    el.style.setProperty('--masonry-horizontal-gutter', `${gutter}px`);
    el.style.setProperty('--masonry-vertical-gutter', `${gutter}px`);
    if (options.animationDuration) {
      el.style.setProperty('--masonry-animation-duration', `${options.animationDuration}ms`);
    }
    if (options.animationTimingFunction) {
      el.style.setProperty('--masonry-animation-timing', options.animationTimingFunction);
    }
    if (options.stagger) {
      el.style.setProperty('--masonry-stagger-delay', `${options.stagger}ms`);
    }
  }

  private getHorizontalGutter(): number {
    const options = this.getActiveOptions();
    return options.horizontalGutter || options.gutter || 10;
  }

  private getVerticalGutter(): number {
    const options = this.getActiveOptions();
    return options.verticalGutter || options.gutter || 10;
  }

  private getColumnWidthPx(): number {
    const opts = this.getActiveOptions();
    if (typeof opts.columns === 'number') {
      const containerWidth = this.elementRef.nativeElement.offsetWidth;
      const gutter = this.getHorizontalGutter();
      const columns = opts.columns;
      return (containerWidth - (columns - 1) * gutter) / columns;
    }
    return opts.columnWidth || 200;
  }

  private waitForImages(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.items || this.items.length === 0) {
        resolve();
        return;
      }
      const images = this.items
        .map((item) => Array.from(item.elementRef.nativeElement.querySelectorAll('img')))
        .flat() as HTMLImageElement[];
      if (images.length === 0) {
        resolve();
        return;
      }
      let loadedCount = 0;
      const totalImages = images.length;
      const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) resolve();
      };
      images.forEach((img) => {
        if (img.complete) {
          checkComplete();
        } else {
          img.addEventListener('load', checkComplete);
          img.addEventListener('error', checkComplete);
        }
      });
    });
  }

  private getFilteredItems(): MasonryItemComponent[] {
    const filter = this._filter();
    if (!filter) return this.items.toArray();
    if (typeof filter === 'string') {
      return this.items.filter((item) => item.elementRef.nativeElement.matches(filter));
    }
    if (typeof filter === 'function') {
      return this.items.filter((item) => filter(item));
    }
    return this.items.toArray();
  }

  private applyFilter(filter: MasonryFilter | null): void {
    this.items.forEach((item) => {
      const el = item.elementRef.nativeElement;
      if (filter === null) {
        el.style.display = 'block';
      } else if (typeof filter === 'string') {
        el.style.display = el.matches(filter) ? 'block' : 'none';
      } else if (typeof filter === 'function') {
        el.style.display = filter(item) ? 'block' : 'none';
      }
    });
    this.layout();
    const filteredItems = this.getFilteredItems();
    this.filterComplete.emit(filteredItems);
  }

  private positionItemsJustified(
    items: MasonryItemComponent[],
    columnHeights: number[],
    originLeft: boolean
  ): void {
    const columnCount = this.columns();
    const columnWidth = this.getColumnWidthPx();
    const gutter = this.getHorizontalGutter();
    const verticalGutter = this.getVerticalGutter();
    const containerWidth = this.elementRef.nativeElement.offsetWidth;

    const columnPositions = new Array(columnCount).fill(0).map((_, i) =>
      originLeft ? i * (columnWidth + gutter) : containerWidth - (i + 1) * (columnWidth + gutter) + gutter
    );

    items.forEach((item) => {
      const el = item.elementRef.nativeElement;
      const height = el.offsetHeight;

      let minHeightIndex = 0;
      let minHeight = columnHeights[0];
      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < minHeight) {
          minHeight = columnHeights[i];
          minHeightIndex = i;
        }
      }

      const x = columnPositions[minHeightIndex];
      const y = columnHeights[minHeightIndex];
      el.style.transform = `translate(${x}px, ${y}px)`;
      columnHeights[minHeightIndex] += height + verticalGutter;
    });
  }

  private positionItemsPacked(
    items: MasonryItemComponent[],
    columnHeights: number[],
    originLeft: boolean
  ): void {
    // For now, use justified layout; enhance later for tighter packing
    this.positionItemsJustified(items, columnHeights, originLeft);
  }

  private positionItemsCascade(
    items: MasonryItemComponent[],
    columnHeights: number[],
    originLeft: boolean
  ): void {
    // For now, use justified layout; enhance later for cascading effect
    this.positionItemsJustified(items, columnHeights, originLeft);
  }

  private applyTransitionEffects(item: MasonryItemComponent, index: number, opts: MasonryOptionsGem): void {
    const el = item.elementRef.nativeElement;
    const effect = opts.transitionEffect || 'fade';
    const delay = index * (opts.stagger || 0);
    setTimeout(() => {
      el.classList.add(`masonry-item-${effect}-in`);
    }, delay);
  }

  private executeLayout(animate: boolean): void {
    const opts = this.getActiveOptions();
    const columnCount = this.columns();
    const originLeft = opts.originLeft !== false;

    const columnHeights = new Array(columnCount).fill(0);
    const filteredItems = this.getFilteredItems();

    switch (opts.pack) {
      case 'packed':
        this.positionItemsPacked(filteredItems, columnHeights, originLeft);
        break;
      case 'cascade':
        this.positionItemsCascade(filteredItems, columnHeights, originLeft);
        break;
      default:
        this.positionItemsJustified(filteredItems, columnHeights, originLeft);
    }

    const containerHeight = Math.max(...columnHeights);
    this.elementRef.nativeElement.style.height = `${containerHeight}px`;

    if (animate && opts.animationEnabled) {
      filteredItems.forEach((item, index) => this.applyTransitionEffects(item, index, opts));
    }

    this.layoutComplete.emit(filteredItems);
  }

  private checkBottomReached(): void {
    if (!this.getActiveOptions().infiniteScroll || this.isLoadingMore) return;
    const scrollPosition = window.scrollY + window.innerHeight;
    const threshold = this.getActiveOptions().infiniteScrollThreshold || 200;
    const containerBottom = this.elementRef.nativeElement.offsetTop + this.elementRef.nativeElement.offsetHeight;
    if (scrollPosition >= containerBottom - threshold) {
      this.isLoadingMore = true;
      this.infiniteScrollEvent.emit();
      this.isLoadingMore = false; // Reset after emitting; parent should handle loading state
    }
  }
}
