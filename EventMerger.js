class EventMerger {
  constructor(handler, minBufferTimeMs = 250, maxBufferTimeMs) {
    this.minBufferTimeMs = minBufferTimeMs;
    this.maxBufferTimeMs = maxBufferTimeMs ? (maxBufferTimeMs >= minBufferTimeMs ? maxBufferTimeMs : minBufferTimeMs) : minBufferTimeMs;
    this.queue = {};
    this.handler = handler;

    // add-function: used to add an event to the merger
    // first argument must be the unique identifier, second argument can be a number and will be added to stack on every supressed event
    this.add = function () {
      try {
        const id = (arguments && arguments[0]) ? encodeURI(arguments[0]) : null;
        if (typeof id == null) return;
        if (typeof this.queue == "undefined") throw new Error("queue not found!");

        // if there is already a event with the same id in the queue, update the existing event instead of creating a new one
        if (this.queue && this.queue[id]) {
          const queue = this.queue[id];
          queue.dup++;

          // if the second argument is a number, add it to the stack of the existing event and update the arguments of the existing event
          if (typeof arguments[1] == "number") {
            queue.stack += arguments[1];
            arguments[1] = queue.stack;
            queue.args = Array.from(arguments);
          }

          // if the max buffer time has passed, clear the current timeout and execute the handler immediately
          if (queue.start + this.maxBufferTimeMs < new Date().getTime()) {
            clearTimeout(queue.timeout);
            queue.handler.bind({ queue: queue })(...queue.args);
            delete this.queue[id];
          } else {
            // otherwise, reset the timeout to execute the handler after the remaining buffer time
            clearTimeout(queue.timeout);
            queue.timeout = setTimeout(() => {
              queue.handler.bind({ queue: queue })(...queue.args);
              delete this.queue[id];
            }, this.minBufferTimeMs);
          }
        } else {
          // create a new event in the queue
          const queue = this.queue[id] = {
            args: Array.from(arguments),
            dup: 1,
            handler: this.handler,
            stack: typeof arguments[1] == "number" ? arguments[1] : 0,
            start: new Date().getTime()
          }
          queue.timeout = setTimeout(() => {
            queue.handler.bind({ queue: queue })(...queue.args);
            delete this.queue[id];
          }, this.minBufferTimeMs);
        }
      } catch (error) { EventMerger.error_handler(error); }
    }.bind({
      handler: handler,
      queue: this.queue,
      minBufferTimeMs: minBufferTimeMs,
      maxBufferTimeMs: maxBufferTimeMs || minBufferTimeMs,
    });
  }
};

EventMerger.error_handler = function (error) {
  console.error("[EventMerger] " + error.stack);
};

module.exports = EventMerger;
