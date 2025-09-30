export interface IExtensionSettings {
  isRestricted: boolean;
  borderMode: boolean;
  inspectorMode: boolean;
  borderSize: number;
  borderStyle: string;
  shortcuts: Record<string, string>;
  handleToggleBorderMode: (checked: boolean) => void;
  handleToggleInspectorMode: (checked: boolean) => void;
  handleUpdateBorderSettings: (size: number, style: string) => void;
}
