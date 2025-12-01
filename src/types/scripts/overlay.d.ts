/**
 * Options for creating and appending an element
 *
 * @property id - The ID of the element
 * @property parent - The parent element to append to
 * @property tagName - The tag name of the element (default: 'div')
 * @property classNames - The class names to assign to the element
 */
export type CreateAndAppendOptions = {
  id: string;
  parent: HTMLElement;
  tagName?: string;
  classNames?: string;
};
