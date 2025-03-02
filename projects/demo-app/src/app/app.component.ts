import {Component, OnInit, ViewChild} from '@angular/core';
import {MasonryItemComponent, MasonryOptions, NgxSuperMasonryComponent} from 'ngx-super-masonry';
import {NgForOf, NgIf} from '@angular/common';

interface ImageItem {
  id: number;
  src: string;
  imageLoaded: boolean;
  price: number;
}

@Component({
  selector: 'app-root',
  imports: [MasonryItemComponent, NgxSuperMasonryComponent, NgIf, NgForOf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild(NgxSuperMasonryComponent) masonry!: NgxSuperMasonryComponent<ImageItem>;
  masonryOptions: MasonryOptions<ImageItem> = {
    columns: 2,
    columnWidth: 200,  // Adjust this based on your needs
    gutter: 10,        // Space between items
    animationDuration: 100,
    sortFunction: (items: MasonryItemComponent<ImageItem>[]) => {
      return items.sort((a, b) => b.data.price - a.data.price);
    }
  };

  images: ImageItem[] = [];

  onImageLoad(item: ImageItem) {
    item.imageLoaded = true;
  }

  ngOnInit() {
    this.images = [
      {
        id: 1,
        src: 'https://picsum.photos/id/237/200/300',  // Replace with your image paths
        imageLoaded: false,
        price: 10
      },
      {
        id: 2,
        src: 'https://picsum.photos/seed/picsum/200/300',
        imageLoaded: false,
        price: 20
      },
      {
        id: 3,
        src: 'https://picsum.photos/200/300.jpg',
        imageLoaded: false,
        price: 99
      },
      {
        id: 4,
        src: 'https://picsum.photos/400/300.jpg',
        imageLoaded: false,
        price: 50152
      },
      {
        id: 5,
        src: 'https://picsum.photos/800/300.jpg',
        imageLoaded: false,
        price: 100
      },
      {
        id: 6,
        src: 'https://picsum.photos/200/300.jpg',
        imageLoaded: false,
        price: 999999999999
      },
      {
        id: 7,
        src: 'https://picsum.photos/400/300.jpg',
        imageLoaded: false,
        price: 100
      },
      {
        id: 8,
        src: 'https://picsum.photos/800/300.jpg',
        imageLoaded: false,
        price: 100
      },
      {
        id: 9,
        src: 'https://picsum.photos/200/300.jpg',
        imageLoaded: false,
        price: 100
      },
      {
        id: 10,
        src: 'https://picsum.photos/400/300.jpg',
        imageLoaded: false,
        price: 100
      },
      {
        id: 11,
        src: 'https://picsum.photos/800/300.jpg',
        imageLoaded: false,
        price: 9
      }
    ];
  }

  trackByFn(index: number, item: ImageItem) {
    return `${item.id} - ${index}`;
  }
}

