How to use the test script
--------------------------

This repository contains a small Node.js script, `test_eventMerger.js`, which demonstrates and verifies the behavior of EventMerger.

### Prerequisites

- Node.js installed and available on your PATH.
- A terminal opened in the project root (the folder containing `EventMerger.js` and `test_eventMerger.js`).

### Run the test

From the project root, execute:

```bash
node test_eventMerger.js
```

The script will:

- Create an EventMerger instance with `minBufferTimeMs = 75` and `maxBufferTimeMs = 200`.
- Add multiple events for two different IDs (`event1` and `event2`) at fixed intervals and a single `event3`.
- Log when each event is added and when the merged handler calls occur, including the duplicate count (`dup`) and the accumulated value (`stack`).

Expected results
----------------

Your output will be similar to the following (exact millisecond values may vary slightly depending on your system):

```
# node test_eventMerger.js


[0ms] Starting EventMerger DEBUG/TESTING:
- Event 1 log (50ms per event):
[3ms] Added event1, count: 1
[60ms] Added event1, count: 2
[121ms] Added event1, count: 3
[184ms] Added event1, count: 4
[246ms] Added event1, count: 5
[307ms] Added event1, count: 6

- Event 2 log (25ms per event):
[3ms] Added event2, count: 1
[29ms] Added event2, count: 2
[60ms] Added event2, count: 3
[90ms] Added event2, count: 4
[121ms] Added event2, count: 5
[152ms] Added event2, count: 6

- Event 3 log (only one event):
[3ms] Added event3, count: 1

- Result log of actual event calls:
[90ms] Handle: event3, dup: 1, total value added: 10
[231ms] Handle: event2, dup: 6, total value added: 60
[246ms] Handle: event1, dup: 5, total value added: 50
[385ms] Handle: event1, dup: 1, total value added: 10

- Expected result:
 - Event 3 should be handled first and only once after around 75ms with a count of 1.
 - Event 2 should be handled second and only once after around 200ms with a count of 5.
 - Event 1 should be handled twice: the first time after around 200ms with a count of 5
   and the second time around 75ms later with a count of 1 (after the first time Event 1 was released)
```