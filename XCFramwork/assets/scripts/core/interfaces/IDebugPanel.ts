import { Node } from 'cc';

export interface DebugSection {
  name: string;
  render(container: Node): void;
}

export interface IDebugPanel {
  show(): void;
  hide(): void;
  toggle(): void;
  isVisible(): boolean;
  registerSection(name: string, section: DebugSection): void;
}
