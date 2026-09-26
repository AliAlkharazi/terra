/** Expo Go 54.0.7 does not register NativeMicrotasksCxx. */
module.exports = {
  default: {
    queueMicrotask(callback) {
      Promise.resolve().then(callback);
    },
  },
};
