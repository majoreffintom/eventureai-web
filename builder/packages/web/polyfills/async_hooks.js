// Minimal async_hooks polyfill for Cloudflare Workers
// Provides a stub AsyncLocalStorage that doesn't actually work but prevents build errors

export class AsyncLocalStorage {
  #store = undefined;
  
  getStore() {
    return this.#store;
  }
  
  run(store, callback, ...args) {
    const prev = this.#store;
    this.#store = store;
    try {
      return callback(...args);
    } finally {
      this.#store = prev;
    }
  }
  
  enterWith(store) {
    this.#store = store;
  }
  
  disable() {
    this.#store = undefined;
  }
}

export default {
  AsyncLocalStorage
};
