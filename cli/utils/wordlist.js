const WORDS = [
  "rainbow", "thunder", "crystal", "garden", "falcon",
  "silver", "marble", "harbor", "bridge", "rocket",
  "sunset", "copper", "forest", "planet", "castle",
  "anchor", "breeze", "candle", "dolphin", "eclipse",
  "glacier", "jaguar", "lantern", "meadow", "nebula",
  "orchid", "panther", "quartz", "riddle", "saffron",
  "timber", "umbrella", "velvet", "walrus", "zenith"
];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

module.exports = { getRandomWord, WORDS };
