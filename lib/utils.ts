export const isFunction = <T extends Function>(value: any): value is T =>
  typeof value === 'function';
