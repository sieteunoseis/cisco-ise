const { describe, it } = require("node:test");
const assert = require("node:assert");
const { getRandomWord } = require("../../cli/utils/wordlist.js");
const { checkWriteAllowed } = require("../../cli/utils/confirm.js");

describe("wordlist", () => {
  it("returns a string", () => {
    const word = getRandomWord();
    assert.equal(typeof word, "string");
    assert.ok(word.length > 0);
  });

  it("returns different words (probabilistic)", () => {
    const words = new Set(Array.from({ length: 20 }, () => getRandomWord()));
    assert.ok(words.size > 1, "Expected multiple unique words");
  });
});

describe("checkWriteAllowed", () => {
  it("allows writes when not read-only", async () => {
    const result = await checkWriteAllowed({ readOnly: false });
    assert.equal(result, true);
  });

  it("throws in non-interactive mode when read-only", () => {
    const origIsTTY = process.stdin.isTTY;
    process.stdin.isTTY = false;
    assert.throws(
      () => checkWriteAllowed({ readOnly: true }),
      /read-only/i
    );
    process.stdin.isTTY = origIsTTY;
  });
});
