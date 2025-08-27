import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateVideo } from './create-video';

describe('CreateVideo', () => {
  let component: CreateVideo;
  let fixture: ComponentFixture<CreateVideo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateVideo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateVideo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
