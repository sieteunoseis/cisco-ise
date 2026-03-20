const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function createSpinner(message = "Loading...") {
  if (!process.stderr.isTTY) return { stop() {} };

  let i = 0;
  const timer = setInterval(() => {
    process.stderr.write(`\r${frames[i++ % frames.length]} ${message}`);
  }, 80);

  return {
    stop(clear = true) {
      clearInterval(timer);
      if (clear) process.stderr.write("\r" + " ".repeat(message.length + 4) + "\r");
    },
  };
}

module.exports = { createSpinner };
