import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface DocumentationLink {
  label: string;
  description: string;
  route: string;
}

@Component({
  imports: [RouterLink],
  selector: 'app-docs-index',
  styleUrl: './docs-index.scss',
  templateUrl: './docs-index.html',
})
export class DocsIndex {
  readonly documentationLinks: DocumentationLink[] = [
    {
      label: 'Components',
      description: 'Reusable buttons, inputs, cards, lists, modals and feedback states.',
      route: '/docs/styles',
    },
    {
      label: 'Terms and Conditions',
      description: 'Rules and conditions for using FreeHonGo.',
      route: '/docs/legal/terms-and-conditions',
    },
    {
      label: 'Privacy Policy',
      description: 'How FreeHonGo handles account and practice data.',
      route: '/docs/legal/privacy-policy',
    },
    {
      label: 'Credits and Licenses',
      description: 'Third-party resources and licenses used by the project.',
      route: '/docs/legal/credits-and-licences',
    },
  ];
}
