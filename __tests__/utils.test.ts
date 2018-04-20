import { isFunction } from '../lib/utils';

describe('#isFunction()', () => {
  test('it should return false if not a function', () => {
    expect(isFunction([])).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction('hello')).toBe(false);
    expect(isFunction(false)).toBe(false);
  });

  test('it should return true if this is a function instance', () => {
    function myFunction() {
      return 'hello';
    }

    expect(isFunction(myFunction)).toBe(true);
  });
});
