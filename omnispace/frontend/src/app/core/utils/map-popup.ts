/** Leaflet accepts HTML strings, so construct text nodes for untrusted listing fields. */
export function propertyPopup(title: string, location: string): HTMLElement {
  const element = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = title;
  element.append(heading, document.createElement('br'), document.createTextNode(location));
  return element;
}
