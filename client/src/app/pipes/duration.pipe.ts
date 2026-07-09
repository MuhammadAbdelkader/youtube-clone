import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value == null) return '0:00';
    
    let seconds = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(seconds)) return '0:00';
    
    seconds = Math.round(seconds);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
