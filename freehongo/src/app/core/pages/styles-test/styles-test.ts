import { Component, computed, signal, ViewChild } from '@angular/core';
import { ActionBtn } from '../../../shared/components/action-btn/action-btn';
import { IconBtn } from '../../../shared/components/icon-btn/icon-btn';
import { NavigationBtn } from '../../../shared/components/navigation-btn/navigation-btn';
import { InputField } from '../../../shared/components/input/input';
import { FileUpload } from '../../../shared/components/file-upload/file-upload';
import { ToggleButton } from '../../../shared/components/toggle-button/toggle-button';
import { SegmentedControl } from '../../../shared/components/segmented-control/segmented-control';
import { PaginationController } from '../../../shared/components/pagination-controller/pagination-controller';
import { SelectField, SelectOption } from '../../../shared/components/select/select';
import { Chip } from '../../../shared/components/chip/chip';
import { ChipGroup } from '../../../shared/components/chip-group/chip-group';
import { List } from '../../../shared/components/list/list';
import { Modal } from '../../../shared/components/modal/modal';
import { Confirmation } from '../../../shared/components/confirmation/confirmation';
import { FeedbackToast } from '../../../shared/components/feedback-toast/feedback-toast';
import { Table } from '../../../shared/components/table/table';
import { LoadingState } from '../../../shared/components/app-state/loading-state/loading-state';
import { ErrorState } from '../../../shared/components/app-state/error-state/error-state';
import { TableColumn, TableRow } from '../../../shared/components/table/interface/table.interface';
import { Card } from '../../../shared/components/card/card';
import { DemoBlock } from '../../../shared/components/demo-block/demo-block';
import { SNIPPETS } from '../../../core/snippets/design.snippets';
import { Milestone, Progressbar } from '../../../shared/components/progressbar/progressbar';

interface Project {
  id: number;
  name: string;
  status: 'active' | 'pending' | 'archived';
  progress: number;
  budget: number;
  deadline: string;
}

@Component({
  imports: [
    ActionBtn,
    IconBtn,
    NavigationBtn,
    InputField,
    FileUpload,
    ToggleButton,
    SegmentedControl,
    PaginationController,
    SelectField,
    Chip,
    ChipGroup,
    List,
    Modal,
    Confirmation,
    FeedbackToast,
    Table,
    LoadingState,
    ErrorState,
    Card,
    DemoBlock,
    Progressbar,
  ],
  selector: 'app-styles-test',
  styleUrl: './styles-test.scss',
  templateUrl: './styles-test.html',
})
export class StylesTest {
  @ViewChild('confirmModal') confirmModal!: Modal;
  @ViewChild('feedbackToast') toast!: FeedbackToast;

  snippets = SNIPPETS;

  progress = signal<number>(40);
  currentPage = signal<number>(1);
  pageSize = signal<number>(5);
  segmentedSelected = signal<string>('list');
  toggle = signal<boolean>(true);
  selectedLanguage = signal<string>('typescript');

  deleteOpen = signal(false);
  discardOpen = signal(false);
  logoutOpen = signal(false);

  loading = signal<boolean>(false);
  hasError = signal<boolean>(false);

  totalPages = computed(() => Math.max(1, Math.ceil(this.allProjects.length / this.pageSize())));
  pagedProjects = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.allProjects.slice(start, start + this.pageSize());
  });

  languageOptions: SelectOption[] = [
    { label: 'TypeScript', value: 'typescript' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C# (Coming soon)', value: 'csharp', disabled: true },
  ];

  projects: Project[] = [
    {
      id: 1,
      name: 'FreeHongo',
      status: 'active',
      progress: 0.75,
      budget: 1200,
      deadline: '2026-12-15',
    },
    {
      id: 2,
      name: 'PixelArtStudio',
      status: 'pending',
      progress: 0.3,
      budget: 800,
      deadline: '2027-01-20',
    },
    {
      id: 3,
      name: 'Sleeper',
      status: 'active',
      progress: 0.9,
      budget: 450,
      deadline: '2026-11-30',
    },
    {
      id: 4,
      name: 'Old prototype',
      status: 'archived',
      progress: 1,
      budget: 0,
      deadline: '2025-06-01',
    },
  ];

  allProjects: Project[] = Array.from({ length: 23 }, (_, i) => ({
    id: i + 1,
    name: `Project ${i + 1}`,
    status: (['active', 'pending', 'archived'] as const)[i % 3],
    progress: ((i * 7) % 100) / 100,
    budget: (i % 4) * 400,
    deadline: '2026-12-15',
  }));

  columns: TableColumn<Project>[] = [
    { key: 'id', header: '#', align: 'center' },
    { key: 'name', header: 'Project' },
    {
      key: 'status',
      header: 'Status',
      formatter: (value) => String(value).toUpperCase(),
    },
    {
      key: 'progress',
      header: 'Progress',
      align: 'right',
      formatter: (value) => `${Math.round(Number(value) * 100)}%`,
    },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      formatter: (value) =>
        Number(value) === 0 ? '-' : `$${Number(value).toLocaleString('en-US')}`,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      formatter: (value) => new Date(String(value)).toLocaleDateString('en-US'),
    },
  ];

  milestones: Milestone[] = [
    { value: 0, label: 'Start' },
    { value: 25, label: 'Basics' },
    { value: 50, label: 'Halfway' },
    { value: 75, label: 'Advanced' },
    { value: 100, label: 'Done' },
  ];

  nothing = (): void => {};
  onFilesChange(files: File[]): void {}
  onValidationError(error: string): void {}
  onToggleChange(value: boolean): void {
    this.toggle.set(!this.toggle());
  }
  onDisplayChange(value: Event): void {}
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;

    this.currentPage.set(page);
  }
  onDisplayModeChange(value: string): void {
    this.segmentedSelected.set(value);
  }
  onLanguageChange(value: string): void {
    this.selectedLanguage.set(value);
  }
  openModal = (): void => {
    this.confirmModal.open();
  };

  closeModal = (): void => {
    this.confirmModal.close();
  };

  openDelete = (): void => this.deleteOpen.set(true);
  openDiscard = (): void => this.discardOpen.set(true);
  openLogout = (): void => this.logoutOpen.set(true);

  cancelDelete = (): void => this.deleteOpen.set(false);
  cancelDiscard = (): void => this.discardOpen.set(false);
  cancelLogout = (): void => this.logoutOpen.set(false);

  confirmDelete = (): void => {
    this.deleteOpen.set(false);
    this.toast.show('Project deleted');
  };

  confirmDiscard = (): void => {
    this.discardOpen.set(false);
    this.toast.show('Changes discarded', 2000);
  };

  confirmLogout = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    this.logoutOpen.set(false);
    this.toast.show('Signed out successfully', 3000);
  };

  showDefault = (): void => this.toast.show('Saved');
  showShort = (): void => this.toast.show('Copied to clipboard', 800);
  showLong = (): void => this.toast.show('Your changes will be applied in a few minutes', 4000);
  openProject = (): void => this.toast.show('Opening project...');

  hideArchived = (row: TableRow): boolean => (row as Project).status !== 'archived';

  simulateLoad = async (): Promise<void> => {
    this.hasError.set(false);
    this.loading.set(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    this.loading.set(false);
  };

  simulateError = (): void => this.hasError.set(true);

  retry = async (): Promise<void> => {
    await this.simulateLoad();
  };

  increaseProgress = (): void => this.progress.update((v) => Math.min(100, v + 10));
  decreaseProgress = (): void => this.progress.update((v) => Math.max(0, v - 10));
}
