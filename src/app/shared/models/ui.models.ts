// Modelos para componentes de UI compartidos

export interface SidebarItem {
  icon: string;
  labelKey: string; // Clave de traducción
  route?: string;
  active?: boolean;
  children?: SidebarItem[]; // Subitems
  expanded?: boolean; // Para controlar si está expandido
  parent?: boolean; // Para identificar items padre
  disabled?: boolean; // Para deshabilitar items
}

export interface AuthFormConfig {
  showRememberMe?: boolean;
  showTermsCheckbox?: boolean;
  submitButtonText: string;
  title: string;
  subtitle: string;
  linkText: string;
  linkRoute: string;
  linkLabel: string;
} 