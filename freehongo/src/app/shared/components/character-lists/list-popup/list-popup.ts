import { Component } from '@angular/core';
import { Modal } from '../../modal/modal';
import { ListsDisplay } from '../lists-display/lists-display';

@Component({
  selector: 'app-list-popup',
  imports: [Modal, ListsDisplay],
  templateUrl: './list-popup.html',
  styleUrl: './list-popup.scss',
})
export class ListPopup {}
