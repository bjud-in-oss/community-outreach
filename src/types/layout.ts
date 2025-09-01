/**
 * Layout types for the adaptive layout system
 * Supporting Arbetsläget (desktop/tablet) and Flik-läget (mobile) layouts
 */

export type LayoutMode = 'arbetslaget' | 'flik-laget';

export type ViewType = 'samtalet' | 'sidorna';

export interface LayoutState {
  mode: LayoutMode;
  activeView: ViewType;
  isTransitioning: boolean;
}

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface AdaptiveLayoutProps {
  children?: React.ReactNode;
  defaultView?: ViewType;
  onViewChange?: (view: ViewType) => void;
  onLayoutModeChange?: (mode: LayoutMode) => void;
}

export interface ViewComponentProps {
  isActive: boolean;
  layoutMode: LayoutMode;
  className?: string;
}