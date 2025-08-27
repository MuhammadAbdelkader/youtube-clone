import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoDetails } from './video-details';

describe('VideoDetails', () => {
  let component: VideoDetails;
  let fixture: ComponentFixture<VideoDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
