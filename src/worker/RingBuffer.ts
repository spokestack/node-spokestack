export default class RingBuffer<T> {
  data: T[]
  maxSize: number
  readPos: number
  writePos: number

  constructor(capacity: number) {
    this.data = []
    this.maxSize = capacity + 1
    this.readPos = this.writePos = 0
  }

  /**
   * Returns the maximum number of elements that can be stored
   */
  capacity(): number {
    return this.maxSize - 1
  }

  /**
   * Returns true if no elements can be read, false otherwise
   */
  isEmpty(): boolean {
    return this.readPos == this.writePos
  }

  /**
   * Returns true if no elements can be written, false otherwise
   */
  isFull(): boolean {
    return this.pos(this.writePos + 1) == this.readPos
  }

  /**
   * seeks the read head to the beginning, marking it full and
   * allowing all elements to be read.
   */
  rewind(): RingBuffer<T> {
    this.readPos = this.pos(this.writePos + 1)
    return this
  }

  /**
   * seeks the read head forward.
   */
  seek(elems: number): RingBuffer<T> {
    this.readPos = this.pos(this.readPos + elems)
    return this
  }

  /**
   * resets the read head buffer, marking the buffer empty, but not
   * modifying any elements.
   */
  reset(): RingBuffer<T> {
    this.readPos = this.writePos
    return this
  }

  /**
   * fills the remaining positions in the buffer with the specified value.
   */
  fill(value: T): RingBuffer<T> {
    while (!this.isFull()) {
      this.write(value)
    }
    return this
  }

  /**
   * dumps the full buffer to an array, starting from the current read position.
   */
  toArray(): T[] {
    this.rewind()
    const array = []
    while (!this.isEmpty()) {
      array.push(this.read())
    }
    return array
  }

  /**
   * reads the next value from the buffer.
   * Returns the value that was read
   */
  read(): T {
    if (this.isEmpty()) {
      throw new Error('ring buffer empty')
    }

    const value = this.data[this.readPos]
    this.readPos = this.pos(this.readPos + 1)
    return value
  }

  /**
   * writes the specified value to the next position in the buffer.
   */
  write(value: T): void {
    if (this.isFull()) throw new Error('buffer full')

    this.data[this.writePos] = value
    this.writePos = this.pos(this.writePos + 1)
  }

  pos(x: number): number {
    // Math.floorMod from OpenJDK
    let mod = x % this.maxSize
    if ((mod ^ this.maxSize) < 0 && mod !== 0) {
      mod += this.maxSize
    }
    return mod
  }
}
