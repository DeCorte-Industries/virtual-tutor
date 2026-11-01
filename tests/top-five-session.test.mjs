// The Top Five editor must start after a sign-in no matter which runs first: the /admin/ page's
// sign-in (which sets window.adminSession and fires "admin:signedin") or public/admin/top-five-session.js.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../public/admin/top-five-session.js", import.meta.url), "utf8");

function setup() {
  const win = { adminSession: null };
  const doc = new EventTarget();
  const context = { EventTarget, CustomEvent };
  vm.runInNewContext(source, context);
  const calls = [];
  const page = {
    signIn(password) {
      win.adminSession = { password };
      doc.dispatchEvent(new CustomEvent("admin:signedin", { detail: { password } }));
    },
    signOut() {
      win.adminSession = null;
      doc.dispatchEvent(new CustomEvent("admin:signedout"));
    },
    connect() {
      context.tfConnectSession(
        win,
        doc,
        (pw) => calls.push(["in", pw]),
        () => calls.push(["out"]),
      );
    },
  };
  return { page, calls };
}

test("editor loaded before the sign-in starts on the event", () => {
  const { page, calls } = setup();
  page.connect();
  assert.deepEqual(calls, []);
  page.signIn("pw");
  assert.deepEqual(calls, [["in", "pw"]]);
});

test("editor loaded after a restored sign-in starts from the flag (the race from the PR #15 review)", () => {
  const { page, calls } = setup();
  page.signIn("pw"); // event fires while nobody is listening yet
  page.connect();
  assert.deepEqual(calls, [["in", "pw"]]);
});

test("the flag and a repeated event don't start the editor twice", () => {
  const { page, calls } = setup();
  page.signIn("pw");
  page.connect();
  page.signIn("pw");
  assert.deepEqual(calls, [["in", "pw"]]);
});

test("sign-out stops the editor and a later sign-in starts it again", () => {
  const { page, calls } = setup();
  page.connect();
  page.signIn("pw");
  page.signOut();
  page.signIn("pw");
  assert.deepEqual(calls, [["in", "pw"], ["out"], ["in", "pw"]]);
});

test("a signed-out page doesn't start the editor", () => {
  const { page, calls } = setup();
  page.signIn("pw");
  page.signOut();
  page.connect();
  assert.deepEqual(calls, []);
});
