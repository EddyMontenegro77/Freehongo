import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string | null;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  templateUrl: './file-upload.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './file-upload.scss',
})
export class FileUpload {
  label = input('Upload files');
  hint = input('Drag files here or click to browse.');
  accept = input('');
  multiple = input(true);
  maxFiles = input<number | null>(null);
  maxSizeBytes = input<number | null>(null);
  disabled = input(false);
  allowReorder = input(true);

  filesChange = output<File[]>();
  validationError = output<string>();

  items = signal<UploadItem[]>([]);
  isDragging = signal(false);
  private draggedIndex: number | null = null;

  openPicker(inputElement: HTMLInputElement): void {
    if (!this.disabled()) inputElement.click();
  }

  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.addFiles(inputElement.files);
    inputElement.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (event.currentTarget === event.target) this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (!this.disabled()) this.addFiles(event.dataTransfer?.files ?? null);
  }

  onItemDragStart(index: number, event: DragEvent): void {
    if (!this.allowReorder()) return;
    this.draggedIndex = index;
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onItemDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === index) return;

    const next = [...this.items()];
    const [moved] = next.splice(this.draggedIndex, 1);
    next.splice(index, 0, moved);
    this.items.set(next);
    this.draggedIndex = null;
    this.emitFiles();
  }

  remove(index: number): void {
    const next = [...this.items()];
    const [removed] = next.splice(index, 1);
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    this.items.set(next);
    this.emitFiles();
  }

  private addFiles(fileList: FileList | null): void {
    if (!fileList?.length) return;

    const incoming = Array.from(fileList);
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!this.isAccepted(file)) {
        this.validationError.emit(`${file.name} type not allowed.`);
        continue;
      }
      if (this.maxSizeBytes() !== null && file.size > this.maxSizeBytes()!) {
        this.validationError.emit(`${file.name} exceeds maximux file size.`);
        continue;
      }
      accepted.push(file);
    }

    const nextFiles = this.multiple()
      ? [...this.items().map((item) => item.file), ...accepted]
      : accepted.slice(0, 1);
    const limitedFiles =
      this.maxFiles() === null ? nextFiles : nextFiles.slice(0, this.maxFiles()!);
    if (limitedFiles.length < nextFiles.length) {
      this.validationError.emit(`Only ${this.maxFiles()} files are admitted.`);
    }

    this.items().forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    this.items.set(
      limitedFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      })),
    );
    this.emitFiles();
  }

  private isAccepted(file: File): boolean {
    const acceptedTypes = this.accept()
      .split(',')
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean);

    if (!acceptedTypes.length) return true;

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    return acceptedTypes.some(
      (type) =>
        type === fileType ||
        (type.endsWith('/*') && fileType.startsWith(type.slice(0, -1))) ||
        (type.startsWith('.') && fileName.endsWith(type)),
    );
  }

  private emitFiles(): void {
    this.filesChange.emit(this.items().map((item) => item.file));
  }
}
