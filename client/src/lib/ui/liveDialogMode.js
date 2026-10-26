const LIVE_OPEN_ATTRIBUTE = "data-impeccable-live-open";

// Native modal dialogs always sit above ordinary z-index overlays.
function impeccableLiveIsActive() {
  return typeof window !== "undefined" && window.__IMPECCABLE_LIVE_INIT__ === true;
}

function show(dialog) {
  if (!dialog || dialog.open) return;

  if (impeccableLiveIsActive()) {
    if (typeof dialog.show === "function") dialog.show();
    else dialog.setAttribute("open", "");
    dialog.setAttribute(LIVE_OPEN_ATTRIBUTE, "");
    return;
  }

  dialog.removeAttribute(LIVE_OPEN_ATTRIBUTE);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function syncMode(dialog) {
  if (!dialog?.open) return;

  const shouldBeModeless = impeccableLiveIsActive();
  const isModeless = dialog.hasAttribute(LIVE_OPEN_ATTRIBUTE);
  if (shouldBeModeless === isModeless) return;

  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
  if (shouldBeModeless) {
    if (typeof dialog.show === "function") dialog.show();
    else dialog.setAttribute("open", "");
    dialog.setAttribute(LIVE_OPEN_ATTRIBUTE, "");
  } else {
    dialog.removeAttribute(LIVE_OPEN_ATTRIBUTE);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
}

export function showDialogForLiveSession(dialog) {
  show(dialog);
}

export function observeLiveDialogMode(dialog) {
  if (!dialog || typeof MutationObserver === "undefined" || !document.body) {
    return () => {};
  }

  const observer = new MutationObserver(() => syncMode(dialog));
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
