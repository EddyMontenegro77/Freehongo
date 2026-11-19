export const SNIPPETS = {
  actionBtn: `<app-action-btn title="Accent" variant="accent" [action]="onClick" />
<app-action-btn title="Disabled" variant="success" [disabled]="true" [action]="onClick" />

// variants: primary | secondary | light | dark | accent | danger | success`,

  iconBtn: `<app-icon-btn iconSrc="add_icon_dark.svg" title="" [action]="onClick" />
<app-icon-btn
  iconSrc="add_icon_dark.svg"
  [showText]="true"
  title="Bookmark"
  [action]="onClick"
/>

// The icon is a mask: only the shape of the SVG matters.
// Its color is the text color of the container (currentColor).

// Override the color or size from the outside:
// app-icon-btn {
//   --icon-btn-color: var(--color-accent);
//   --icon-btn-size: 2rem;
// }`,

  navigationBtn: `<app-navigation-btn title="Navigation" />
<app-navigation-btn
  title="Navigation"
  icon="add_icon_dark.svg"
  [showText]="true"
  [route]="['/']"
/>`,

  toggle: `<app-toggle-button
  label="Toggle"
  [checked]="toggle()"
  [disabled]="false"
  (checkedChange)="onToggleChange($event)"
/>

<app-toggle-button
  label="Custom label"
  onLabel="Enabled"
  offLabel="Disabled"
  [checked]="toggle()"
  (checkedChange)="onToggleChange($event)"
/>`,

  segmented: `<app-segmented-control
  label="Display mode"
  [value]="segmentedSelected()"
  [options]="[
    { label: 'Grid', value: 'grid' },
    { label: 'List', value: 'list' },
    { label: 'Disabled', value: 'disabled', disabled: true },
  ]"
  [disabled]="false"
  [wrap]="false"
  (valueChange)="onDisplayModeChange($event)"
/>`,

  pagination: `<app-table [headers]="columns" [rows]="pagedProjects()" />

<app-pagination-controller
  [currentPage]="currentPage()"
  [totalPages]="totalPages()"
  (pageChange)="onPageChange($event)"
/>

// component
currentPage = signal(1);
pageSize = signal(5);

totalPages = computed(() => Math.ceil(items.length / this.pageSize()));

pagedItems = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize();
  return items.slice(start, start + this.pageSize());
});`,

  input: `<app-input
  label="Email Address"
  type="email"
  placeholder="user@example.com"
  helperText="Enter a valid email address"
  autocomplete="email"
  [required]="true"
/>

// types: text | password | email | number | search | tel | url | date | time | datetime-local`,

  fileUpload: `<app-file-upload
  label="Upload your files"
  hint="Drag and drop your files here or click to browse."
  accept="image/*,.pdf,.doc,.docx"
  [multiple]="true"
  [maxFiles]="5"
  [maxSizeBytes]="5242880"
  [allowReorder]="true"
  (filesChange)="onFilesChange($event)"
  (validationError)="onValidationError($event)"
/>`,

  select: `<app-select
  label="Preferred language"
  [value]="selectedLanguage()"
  [options]="languageOptions"
  placeholder="Select a language"
  helperText="Choose your preferred programming language."
  [required]="true"
  (valueChange)="onLanguageChange($event)"
/>`,

  chip: `<app-chip>Angular</app-chip>

<app-chip-group title="Technologies" layout="wrap">
  <app-chip>Angular</app-chip>
  <app-chip>TypeScript</app-chip>
</app-chip-group>

// layout: wrap | stack`,

  list: `<app-list [items]="['Angular', 'React', 'Vue']" listType="ul" marker="disc" />

<app-list
  [items]="['Install', 'Configure', 'Run']"
  listType="ol"
  marker="decimal"
/>

// ul markers: disc | circle | square`,

  table: `<app-table
  [headers]="columns"
  [rows]="projects"
  [showRow]="hideArchived"
  tableAlignment="center"
/>

// columns: TableColumn<Project>[] = [
//   { key: 'name', header: 'Project' },
//   { key: 'progress', header: 'Progress', align: 'right',
//     formatter: (value) => Math.round(Number(value) * 100) + '%' },
// ];`,

  card: `<app-card variant="outline" size="md" hoverable>
  <h3 card-header>FreeHongo</h3>

  <div card-body>
    <p>App to learn Japanese.</p>
  </div>

  <div card-footer>
    <app-action-btn title="View project" variant="accent" [action]="onClick" />
  </div>
</app-card>

// variant: outline | elevated   size: sm | md | lg`,

  progressbar: `<app-progressbar
  [value]="progress()"
  [max]="100"
  [milestones]="milestones"
  barAriaLabel="Course progress"
/>

// milestones: Milestone[] = [
//   { value: 0, label: 'Start' },
//   { value: 50, label: 'Halfway' },
//   { value: 100, label: 'Done' },
// ];`,

  loadingState: `<app-loading-state />
<app-loading-state message="Loading projects..." />`,

  errorState: `<app-error-state
  title="Something went wrong"
  message="We couldn't load your projects."
  actionTitle="Retry"
  [action]="retry"
/>

// without [action] the button is not rendered`,

  toast: `<app-feedback-toast #feedbackToast />

// component
toast = viewChild<FeedbackToast>('feedbackToast');
showSaved = (): void => this.toast()?.show('Saved', 2000);`,

  modal: `<app-modal title="Confirm action" #confirmModal>
  <div modal-body>
    <p>Are you sure you want to continue?</p>
  </div>

  <div modal-footer>
    <app-action-btn title="Cancel" [action]="closeModal" variant="secondary" />
    <app-action-btn title="Confirm" [action]="onConfirm" variant="accent" />
  </div>
</app-modal>

// component
confirmModal = viewChild<Modal>('confirmModal');
openModal = (): void => this.confirmModal()?.open();
closeModal = (): void => this.confirmModal()?.close();`,

  confirmation: `<app-confirmation
  [open]="deleteOpen()"
  title="Delete project"
  message="This action cannot be undone."
  confirmText="Delete"
  cancelText="Keep it"
  confirmVariant="danger"
  cancelVariant="secondary"
  [confirmAction]="confirmDelete"
  [cancelAction]="cancelDelete"
/>

// the parent controls "open": both actions must set it to false`,
};
