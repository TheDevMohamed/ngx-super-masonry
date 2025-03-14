# ngx-super-masonry

A high-performance masonry layout library for Angular applications with advanced configuration options for responsive designs.

![Angular](https://img.shields.io/badge/Angular-v17+-red.svg)

## Overview

`ngx-super-masonry` provides an optimized implementation of the masonry grid layout pattern for Angular applications. The library offers dynamic column calculation, responsive layouts, animation support, and filtering/sorting capabilities with minimal performance impact.

## Features

- **Dynamic Column Sizing** - Choose between auto-responsive or fixed column layouts
- **Performance Optimized** - Minimizes reflow operations and batches DOM updates
- **Animation Support** - Smooth transitions when items change position
- **Filtering & Sorting** - Built-in support for custom item filtering and ordering
- **TypeScript Support** - Fully typed API with generic support for item data
- **Responsive Design** - Automatically adapts to container width changes

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
  imports: [MasonryItemComponent, NgxSuperMasonryComponent, NgForOf],
  template: `
    <lib-ngx-super-masonry [options]="masonryOptions">
      <lib-masonry-item *ngFor="let item of items" [data]="item">
        <!-- Your item content here -->
      </lib-masonry-item>
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
| columns | 'auto' \| number | 'auto' | Column calculation mode |
| columnWidth | number | 200 | Width of each column in auto mode |
| gutterX | number | 10 | Horizontal spacing between items |
| gutterY | number | 10 | Vertical spacing between items |
| animationDuration | number | 0 | Duration of animations in ms |
| filterFunction | Function | undefined | Custom function to filter items |
| sortFunction | Function | undefined | Custom function to sort items |

## Performance Considerations

For optimal performance:

1. Use the `trackByFn` with `*ngFor` to improve rendering efficiency
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

Check out the [live demo](https://ngx-super-masonry.vercel.app/) to see ngx-super-masonry in action and experiment with different configuration options.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
