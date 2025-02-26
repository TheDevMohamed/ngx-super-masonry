import {Component, OnInit, ViewChild} from '@angular/core';
import {MasonryItemComponent, NgxSuperMasonryComponent} from 'ngx-super-masonry';
import {NgForOf, NgIf} from '@angular/common';

interface ImageItem {
  id: number;
  src: string;
  loaded: boolean;
}

@Component({
  selector: 'app-root',
  imports: [MasonryItemComponent, NgxSuperMasonryComponent, NgForOf, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild(NgxSuperMasonryComponent) masonry!: NgxSuperMasonryComponent;
  loadedItems = 0;
  masonryOptions = {
    columns: 2,
    columnWidth: 200,  // Adjust this based on your needs
    gutter: 10,        // Space between items
    animationDuration: 100
  };

  images: ImageItem[] = [];

  onImageLoad(item: ImageItem) {
    item.loaded = true;
  }

  ngOnInit() {
    this.images = [
      {
        id: 1,
        src: 'https://picsum.photos/id/237/200/300',  // Replace with your image paths
        loaded: false
      },
      {
        id: 2,
        src: 'https://picsum.photos/seed/picsum/200/300',
        loaded: false
      },
      {
        id: 3,
        src: 'https://picsum.photos/200/300.jpg',
        loaded: false
      },
      {
        id: 4,
        src: 'https://picsum.photos/400/300.jpg',
        loaded: false
      },
      {
        id: 5,
        src: 'https://picsum.photos/800/300.jpg',
        loaded: false
      },
      {
        id: 6,
        src: 'https://picsum.photos/200/300.jpg',
        loaded: false
      },
      {
        id: 7,
        src: 'https://picsum.photos/400/300.jpg',
        loaded: false
      },
      {
        id: 8,
        src: 'https://picsum.photos/800/300.jpg',
        loaded: false
      },
      {
        id: 9,
        src: 'https://picsum.photos/200/300.jpg',
        loaded: false
      },
      {
        id: 10,
        src: 'https://picsum.photos/400/300.jpg',
        loaded: false
      },
      {
        id: 11,
        src: 'https://picsum.photos/800/300.jpg',
        loaded: false
      }
    ];
  }

  trackByFn(index: number, item: ImageItem) {
    return `${item.id} - ${index}`;
  }
}

