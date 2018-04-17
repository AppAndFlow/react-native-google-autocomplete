declare type ElementEventTemplate<E> = {
  target: E;
} & Event;

declare type InputEvent = ElementEventTemplate<HTMLInputElement>;
