  EventMergerJS
  =============

  Small zero-dependency JavaScript helper to merge/buffer bursts of logically identical events.

  Typical use case: a client produces a lot of small updates (e.g. position changes, damage ticks, slider changes) and you only want to send/handle them at a limited rate while still knowing how many were merged together.

  Features
  --------

  - Per‑ID buffering: events are grouped by a unique identifier (first argument).
  - Minimum buffer time: wait at least `minBufferTimeMs` before handling an event.
  - Optional maximum buffer time: if two events are fired within `minBufferTimeMs` then `minBufferTimeMs` will be ignored and `maxBufferTimeMs` will be used for the current event coalescence. This is useful to allow fast buffer processing while only single events come in but allows to slow down processing if multiple events come in.
  - Numeric aggregation: optional second argument can be a number that is summed up (`stack`) for all suppressed events.
  - Duplicate count: know how many events were merged (`dup`).

  Demo
  ----

  Try the Demo at: <https://materia79.github.io/EventMergerJS/demo.html>
  
  License
  -------
  MIT License. See [LICENSE.md](LICENSE.md) for full details.

  Installation
  ------------
  This project is a single file; just copy [EventMerger.js](EventMerger.js) into your project or require it directly after adding it as a submodule to you repo:

  ```js
  const EventMerger = require("./EventMerger");
  ```

  API
  ---

  ### Constructor

  ```js
  const merger = new EventMerger(handler, minBufferTimeMs[, maxBufferTimeMs]);
  ```

  - `handler` (function)
    - Called once the buffer timer fires for a given event ID.
    - Receives the same arguments as the *last* `add(...)` call for that ID.
    - Executed with `this` bound to an object containing the queue entry:
      - `this.queue.dup`: number of merged events for this ID.
      - `this.queue.stack`: sum of all numeric second arguments (if provided).
  - `minBufferTimeMs` (number)
    - Minimum time in milliseconds to wait before `handler` is called.
    - Each new event for the same ID resets this timer.
  - `maxBufferTimeMs` (number, optional)
    - Hard upper bound in milliseconds, measured from the *first* event for a given ID.
    - If provided and greater than `minBufferTimeMs`, the handler is forced to run once this time is exceeded (as long as at least two events were received within the minimum buffer time).
    - If omitted, it defaults to `minBufferTimeMs`.


  ### add(id, [value, ...])

  ```js
  merger.add(id, value);
  ```

  - `id`
    - Unique identifier for the logical event stream (e.g. player ID, slider name).
    - All events with the same `id` are merged together.
  - `value` (optional)
    - If the second argument is a number, it is added to an internal `stack` counter on every suppressed event.
    - The final numeric value passed to `handler` as the second argument will be this accumulated `stack`.
  - Additional arguments
    - Any extra arguments after the second are simply forwarded; only the second argument participates in the numeric `stack` behavior.


  How It Works
  ------------

  For each `add(id, ...)` call:

  1. If this is the first event for `id`, a queue entry is created and a timer is scheduled for `minBufferTimeMs`.
  2. If another event with the same `id` arrives before the timer fires:
     - The queue’s `dup` counter is incremented.
     - If the second argument is numeric, it is added to `stack` and the arguments stored for the handler are updated.
     - The timer is reset to fire `minBufferTimeMs` from *now* (sliding window), unless `maxBufferTimeMs` has been exceeded.
  3. If `maxBufferTimeMs` (from the first event’s timestamp) is exceeded while more events keep arriving, the handler is called immediately with the last stored arguments and the queue entry is cleared.


  Usage Example
  -------------

  Simple example that aggregates “damage” notifications for a player and sends a merged report:

  ```js
  const EventMerger = require("./EventMerger");

  const damageHandler = function (playerId, totalDamage) {
    console.log(
      `Handle player ${playerId}, total damage: ${totalDamage}, ` +
      `events merged: ${this.queue.dup}`
    );
  };

  // Wait at least 50 ms, but force send after 100 ms at the latest
  const damageMerger = new EventMerger(damageHandler, 50, 100);

  // These calls may be fired rapidly, e.g. from a game loop
  damageMerger.add("player-123", 10);
  damageMerger.add("player-123", 5);
  damageMerger.add("player-123", 20);

  // After buffering, damageHandler will be called once for "player-123"
  // with totalDamage = 35 and this.queue.dup = 3
  ```

  Custom error handler
  --------------------

  The static function `EventMerger.error_handler` can be overridden if you need to route errors somewhere other than `console.error` (for example to a logger or monitoring service). 
  Make sure to assign your custom handler before creating any `EventMerger` instances:

  ```js
  EventMerger.error_handler = function (error) {
    myLogger.error("[EventMerger]", error);
  };
  ```

  Notes
  -----

  - EventMerger does not schedule or send any network traffic by itself; it only controls *when* your handler is invoked.
  - You are responsible for making the handler side‑effect free or idempotent as needed.
  - The class is designed for Node.js environments but can also be used in browsers with a bundler.