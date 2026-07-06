import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cloudinary',
  standalone: true
})
export class CloudinaryPipe implements PipeTransform {
  transform(url: string | null | undefined, type: 'avatar' | 'thumbnail'): string {
    if (!url || url.includes('example.com') || url.includes('default-avatar.png')) return '';
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

    if (url.includes('/video/upload/') || url.match(/\.(mp4|webm|mkv)$/i)) {
      const combined = transformations.replace(/\/$/, '') + ',so_1/';
      let withTransform = url;
      if (url.includes('/video/upload/')) {
        withTransform = url.replace('/video/upload/', `/video/upload/${combined}`);
      } else {
        withTransform = url.replace('/upload/', `/upload/${combined}`);
      }
      return withTransform.replace(/\.[a-zA-Z0-9]+$/, '.jpg');
    }

    return url.replace('/upload/', `/upload/${transformations}`);
  }
}
