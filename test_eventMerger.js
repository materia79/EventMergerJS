// DEBUG/TESTING:

// This test creates an EventMerger with 200ms buffer, then adds 10 events; 5 named "event1" and the other 5 named "event2"
// - Event 1 will be added every 50ms starting at 0ms.
// - Event 2 will be added every 25ms starting at 0ms.
// - Event 3 will be only added once starting at 0ms.

// Expected result: 
const expected_result = `
 - Event 3 should be handled first and only once after around 75ms with a count of 1.
 - Event 2 should be handled second and only once after around 200ms with a count of 5.
 - Event 1 should be handled twice: the first time after around 200ms with a count of 5
   and the second time around 75ms later with a count of 1 (after the first time Event 1 was released)`;

const EventMerger = require("./EventMerger");

(async () => {
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const test_minBufferTimeMs = 75;
  const test_maxBufferTimeMs = 200;
  let start = new Date().getTime();
  let result_log = "";
  const Merger = new EventMerger(function () {
    result_log += "[" + Math.round(new Date().getTime() - start) + "ms] Handle: " + arguments[0] + ", dup: " + this.queue.dup + ", total value added: " + this.queue.stack + "\n";
  }, test_minBufferTimeMs, test_maxBufferTimeMs);

  let event1_count = 0;
  let event2_count = 0;

  let event1_log = "";
  let event2_log = "";
  let event3_log = "";

  start = new Date().getTime();
  console.log("\n\n[" + Math.round(new Date().getTime() - start) + "ms] Starting EventMerger DEBUG/TESTING:");

  // Event 1 - loop
  // Sending 6 events where 5 of them should be merged into one because they are within the minBufferTimeMs of 75ms.
  // The 6th event should be released seperately because it will be added after the 200ms maxBufferTimeMs of the first event
  // but this depends on the exact timing, so it could be merged or not merged
  (async () => {
    while (event1_count++ <= 5) {
      Merger.add("event1", 10);
      event1_log += "[" + Math.round(new Date().getTime() - start) + "ms] Added event1, count: " + event1_count + "\n";
      await wait(50);
    }
  })();

  // Event 2 - loop
  (async () => {
    while (event2_count++ <= 5) {
      Merger.add("event2", 10);
      event2_log += "[" + Math.round(new Date().getTime() - start) + "ms] Added event2, count: " + event2_count + "\n";
      await wait(25);
    }
  })();

  // Event 3 - single
  Merger.add("event3", 10);
  event3_log += "[" + Math.round(new Date().getTime() - start) + "ms] Added event3, count: 1\n";

  // Wait for all events to be handled
  while (Object.keys(Merger.queue).length) await wait(1);
  // wait a bit more to ensure all events are handled
  await wait(test_maxBufferTimeMs);

  // Print logs
  console.log("- Event 1 log (50ms per event):\n" + event1_log);
  console.log("- Event 2 log (25ms per event):\n" + event2_log);
  console.log("- Event 3 log (only one event):\n" + event3_log);
  console.log("- Result log of actual event calls:\n" + result_log);
  console.log("- Expected result: " + expected_result);
})();
