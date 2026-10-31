/** A bounded branch-aware history. Images remain immutable strings in each snapshot. */
export class EditorHistory<T> {
  private entries: T[] = [];
  private index = -1;
  constructor(private limit = 40) {}
  get canUndo() { return this.index > 0; }
  get canRedo() { return this.index >= 0 && this.index < this.entries.length - 1; }
  reset(value: T) { this.entries = [structuredClone(value)]; this.index = 0; }
  push(value: T) {
    this.entries = this.entries.slice(0, this.index + 1);
    this.entries.push(structuredClone(value));
    if (this.entries.length > this.limit) this.entries.shift();
    this.index = this.entries.length - 1;
  }
  undo(): T | undefined { return this.canUndo ? structuredClone(this.entries[--this.index]) : undefined; }
  redo(): T | undefined { return this.canRedo ? structuredClone(this.entries[++this.index]) : undefined; }
}
