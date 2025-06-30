import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string): SafeResourceUrl {
    // Vérifier si c'est une URL YouTube et la convertir en format embed si nécessaire
    if (url && (url.includes('youtube.com/watch') || url.includes('youtube.com/shorts/'))) {
      const videoId = this.getYoutubeVideoId(url);
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (url && url.includes('youtu.be')) {
      const videoId = this.getYoutubeVideoIdFromShortUrl(url);
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private getYoutubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  private getYoutubeVideoIdFromShortUrl(url: string): string | null {
    const regExp = /^.*(youtu.be\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}