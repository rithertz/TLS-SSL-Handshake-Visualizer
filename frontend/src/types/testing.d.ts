declare module "vitest" {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => void) => void;
  export const expect: (val: unknown) => {
    toBeInTheDocument: () => void;
    toHaveTextContent: (text: string | RegExp) => void;
    toBeDisabled: () => void;
    not: {
      toHaveBeenCalled: () => void;
      toBeInTheDocument: () => void;
    };
    toHaveBeenCalledWith: (...args: unknown[]) => void;
    toHaveBeenCalledTimes: (count: number) => void;
    toHaveBeenCalled: () => void;
  };
  export const vi: {
    fn: <T extends (...args: unknown[]) => unknown>(impl?: T) => T & {
      mock: { calls: unknown[][] };
      toHaveBeenCalled: () => void;
      not: { toHaveBeenCalled: () => void };
      toHaveBeenCalledWith: (...args: unknown[]) => void;
      toHaveBeenCalledTimes: (count: number) => void;
    };
  };
}

declare module "@testing-library/react" {
  export function render(ui: React.ReactElement): void;
  export const screen: {
    getByLabelText: (matcher: string | RegExp) => HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
  };
  export const fireEvent: {
    click: (element: HTMLElement) => void;
    change: (element: HTMLElement, options: { target: { value: string } }) => void;
  };
}
