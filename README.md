A high-performance masonry layout library for Angular applications with advanced configuration options for responsive designs.

<p align="center">
  <img src="https://raw.githubusercontent.com/TheDevMohamed/ngx-super-masonry/main/read-me-banner.png" alt="ngx-super-masonry logo" width="300">
</p>

# ngx-super-masonry

A high-performance masonry layout library for Angular applications with advanced configuration options for responsive designs.

![Angular](https://img.shields.io/badge/Angular-v21+-red.svg)

## Overview

`ngx-super-masonry` provides an optimized implementation of the masonry grid layout pattern for Angular applications. The library offers dynamic column calculation, responsive layouts, animation support, and filtering/sorting capabilities with minimal performance impact.

## Features

- **Dynamic Column Sizing** - Choose between auto-responsive or fixed column layouts
- **Performance Optimized** - Minimizes reflow operations and batches DOM updates
- **Animation Support** - Smooth transitions when items change position
- **Filtering & Sorting** - Built-in support for custom item filtering and ordering
- **TypeScript Support** - Fully typed API with generic support for item data
- **Responsive Design** - Automatically adapts to container width changes

## Version Compatibility

| Library Version | Angular Version |
|-----------------|-----------------|
| 21.x            | 21.x            |
| 20.x            | 20.x            |
| 19.x            | 19.x            |

> **Note:** The library version now matches the Angular major version for easier compatibility management.

## Installation

```bash
npm install ngx-super-masonry --save
```

## Basic Usage

Import and add to your component:

```typescript
import { MasonryItemComponent, NgxSuperMasonryComponent } from 'ngx-super-masonry';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [MasonryItemComponent, NgxSuperMasonryComponent],
  template: `
    <lib-ngx-super-masonry [options]="masonryOptions">
      @for (item of items; track item.id) {
        <lib-masonry-item [data]="item">
          <!-- Your item content here -->
        </lib-masonry-item>
      }
    </lib-ngx-super-masonry>
  `
})
export class GalleryComponent {
  items = [/* your items */];
  
  masonryOptions = {
    columns: 'auto',
    columnWidth: 250,
    gutterX: 10,
    gutterY: 10
  };
}
```

## Configuration Options

The masonry grid can be configured with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| columns | 'auto' \| number \| object | 'auto' | Column calculation mode. Can be a number, 'auto', or a breakpoint object |
| columnWidth | number | 200 | Width of each column in auto mode |
| gutterX | number | 10 | Horizontal spacing between items |
| gutterY | number | 10 | Vertical spacing between items |
| animationDuration | number | 0 | Duration of animations in ms |
| filterFunction | Function | undefined | Custom function to filter items |
| sortFunction | Function | undefined | Custom function to sort items |

### Responsive Column Configuration

You can define different column counts for different screen sizes using the `columns` property as an object. This enables truly responsive layouts that adapt to your container width:

```typescript
masonryOptions = {
  columns: {
    480: 1,   // 1 column below 480px
    640: 2,   // 2 columns from 640px to 767px
    768: 3,   // 3 columns from 768px to 1023px
    1024: 4   // 4 columns from 1024px and above
  },
  gutterX: 10,
  gutterY: 10
};
```

The component automatically selects the appropriate column count based on the current container width, using the largest breakpoint that is less than or equal to the container width.

#### Dynamic Responsive Configuration with Reactive Forms

For even more flexibility, you can combine responsive breakpoints with reactive forms to allow users to customize the layout dynamically:

```typescript
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [NgxSuperMasonryComponent, MasonryItemComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="configForm">
      <!-- Breakpoint Controls -->
      <div formGroupName="responsive">
        <input formControlName="breakpoint480" type="number" min="1" max="4">
        <input formControlName="breakpoint640" type="number" min="1" max="4">
        <input formControlName="breakpoint768" type="number" min="1" max="4">
        <input formControlName="breakpoint1024" type="number" min="1" max="4">
      </div>
    </form>
    
    <lib-ngx-super-masonry [options]="masonryOptions">
      @for (item of items; track item.id) {
        <lib-masonry-item [data]="item">{{ item.title }}</lib-masonry-item>
      }
    </lib-ngx-super-masonry>
  `
})
export class MasonryGridComponent implements OnInit, OnDestroy {
  configForm = this.fb.group({
    responsive: this.fb.group({
      breakpoint480: [1],
      breakpoint640: [2],
      breakpoint768: [3],
      breakpoint1024: [4]
    })
  });

  masonryOptions: MasonryOptions = { columns: 'auto' };
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.configForm.get('responsive')?.valueChanges
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(breakpoints => {
        this.masonryOptions = {
          columns: {
            480: breakpoints.breakpoint480,
            640: breakpoints.breakpoint640,
            768: breakpoints.breakpoint768,
            1024: breakpoints.breakpoint1024
          },
          gutterX: 10,
          gutterY: 10
        };
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Benefits of this approach:**
- **User Control** - Allow end-users to customize column layout for their preferences
- **Real-time Updates** - Changes apply immediately with smooth animations
- **Persistent Configuration** - Save user preferences to localStorage or backend
- **Accessibility** - Helps users with different viewport requirements

## Performance Considerations

For optimal performance:

1. Use the track function with `@for` to improve rendering efficiency
2. Specify image dimensions to reduce layout shifts
3. Use `requestAnimationFrame` for DOM updates
4. Apply CSS containment to reduce layout calculations
5. Pre-calculate content dimensions where possible

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Events

The component provides the following events:

| Event | Description |
|-------|-------------|
| layoutComplete | Emitted when layout calculation completes |
| itemsFiltered | Emitted when items are filtered |
| itemsSorted | Emitted when items are sorted |

## Demo

Check out the <a href="https://ngx-super-masonry.vercel.app/" target="_blank" rel="noopener noreferrer">live demo</a> to see ngx-super-masonry in action and experiment with different configuration options.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.