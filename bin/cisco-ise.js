#!/usr/bin/env node

// Suppress Node.js TLS warning — users opt into insecure mode explicitly
// via --insecure flag or cluster config, so the warning is redundant noise
const originalEmit = process.emit;
process.emit = function (event, warning) {
  if (event === "warning" && warning?.name === "Warning" &&
      warning?.message?.includes("NODE_TLS_REJECT_UNAUTHORIZED")) {
    return false;
  }
  return originalEmit.apply(this, arguments);
};

require("../cli/index.js");
