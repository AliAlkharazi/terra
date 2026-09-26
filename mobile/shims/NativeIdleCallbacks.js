/** Expo Go 54.0.7 does not register NativeIdleCallbacksCxx. */
const pending = new Map();
let nextId = 1;

module.exports = {
  default: {
    requestIdleCallback(callback) {
      const id = nextId++;
      const handle = setTimeout(() => {
        pending.delete(id);
        callback({
          didTimeout: false,
          timeRemaining: () => 16,
        });
      }, 1);
      pending.set(id, handle);
      return id;
    },
    cancelIdleCallback(id) {
      const handle = pending.get(id);
      if (handle) clearTimeout(handle);
      pending.delete(id);
    },
  },
};
