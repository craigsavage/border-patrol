declare module '*.shadow.scss' {
  const cssText: string;
  export default cssText;
}

declare module '*.scss' {
  const styles: Record<string, string>;
  export default styles;
}
