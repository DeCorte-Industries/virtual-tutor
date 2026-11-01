// Connects the Top Five editor (issue #13) to the /admin/ sign-in, whatever order the scripts run in.
// The page's own script sets window.adminSession = { password } when it signs in (null when it signs
// out) and also fires "admin:signedin" / "admin:signedout". A remembered sign-in can be restored before
// the editor script has run, so the editor checks the flag on startup as well as listening for the
// events. onSignIn runs at most once per sign-in, so the flag and the event can't start it twice.
globalThis.tfConnectSession = (win, doc, onSignIn, onSignOut) => {
  let current = null;
  const signIn = (password) => {
    if (!password || password === current) return;
    current = password;
    onSignIn(password);
  };
  const signOut = () => {
    current = null;
    onSignOut();
  };
  doc.addEventListener("admin:signedin", (e) => signIn(e.detail?.password));
  doc.addEventListener("admin:signedout", signOut);
  if (win.adminSession?.password) signIn(win.adminSession.password);
};
