import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cloudinary',
  standalone: true
})
export class CloudinaryPipe implements PipeTransform {
  transform(url: string | null | undefined, type: 'avatar' | 'thumbnail'): string {
    if (!url) return '';
    // Only transform cloudinary URLs
    if (!url.includes('res.cloudinary.com')) return url;
    
    // Check if it already has transformations (like /upload/w_...)
    if (url.match(/\/upload\/[a-z]_/i)) return url;

    let transformations = '';
    if (type === 'avatar') {
      transformations = 'w_150,h_150,c_fill,g_face,q_auto,f_auto/';
    } else if (type === 'thumbnail') {
      transformations = 'w_600,h_340,c_fill,q_auto,f_auto/';
    }

    return url.replace('/upload/', `/upload/${transformations}`);
  }
}
