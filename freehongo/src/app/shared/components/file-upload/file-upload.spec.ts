import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUpload } from './file-upload';

function fileListOf(...files: File[]): FileList {
  const entries = files.reduce<Record<number, File>>((result, file, index) => {
    result[index] = file;
    return result;
  }, {});

  return {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    ...entries,
  } as unknown as FileList;
}

describe('FileUpload', () => {
  let component: FileUpload;
  let fixture: ComponentFixture<FileUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FileUpload] }).compileComponents();
    fixture = TestBed.createComponent(FileUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits selected files', () => {
    const files = [new File(['content'], 'avatar.png', { type: 'image/png' })];
    const emitted: File[][] = [];
    component.filesChange.subscribe((value) => emitted.push(value));

    component.onInput({
      target: { files: fileListOf(...files), value: '' },
    } as unknown as Event);

    expect(component.items()).toHaveLength(1);
    expect(emitted.at(-1)).toEqual(files);
  });

  it('rejects files outside the configured type', () => {
    fixture.componentRef.setInput('accept', 'image/*');
    fixture.detectChanges();
    const errors: string[] = [];
    component.validationError.subscribe((message) => errors.push(message));

    component.onInput({
      target: { files: fileListOf(new File(['content'], 'notes.txt', { type: 'text/plain' })), value: '' },
    } as unknown as Event);

    expect(component.items()).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('reorders files by drag and drop', () => {
    const files = [
      new File(['one'], 'one.txt', { type: 'text/plain' }),
      new File(['two'], 'two.txt', { type: 'text/plain' }),
    ];
    component.onInput({
      target: { files: fileListOf(...files), value: '' },
    } as unknown as Event);

    component.onItemDragStart(0, { dataTransfer: { setData: () => undefined } } as unknown as DragEvent);
    component.onItemDrop(1, { preventDefault: () => undefined } as unknown as DragEvent);

    expect(component.items().map((item) => item.file.name)).toEqual(['two.txt', 'one.txt']);
  });
});
