(() => {
  "use strict";
  const gatekeeperTriggers = document.querySelectorAll("[data-gatekeeper-video]");
  const gatekeeperDialog = document.querySelector("#gatekeeper-dialog");
  const gatekeeperClose = document.querySelector("#close-gatekeeper");
  const gatekeeperVideo = document.querySelector("#gatekeeper-video");
  const gatekeeperTitle = document.querySelector("#gatekeeper-title");
  const gatekeeperSource = document.querySelector("#gatekeeper-source");

  const stopGatekeeper = () => {
    gatekeeperVideo?.querySelector("iframe")?.remove();
  };
  const closeGatekeeper = () => {
    stopGatekeeper();
    if (gatekeeperDialog?.open) gatekeeperDialog.close();
  };

  gatekeeperTriggers.forEach(trigger => trigger.addEventListener("click", () => {
    if (!gatekeeperDialog || !gatekeeperVideo) return;
    stopGatekeeper();
    if (gatekeeperTitle && trigger.dataset.gatekeeperTitle) {
      gatekeeperTitle.textContent = trigger.dataset.gatekeeperTitle;
    }
    if (gatekeeperSource && trigger.dataset.gatekeeperSource) {
      gatekeeperSource.href = trigger.dataset.gatekeeperSource;
    }
    gatekeeperDialog.showModal();
    const frame = document.createElement("iframe");
    frame.title = "The Gatekeeper from the 1991 Nightmare video board game";
    frame.src = trigger.dataset.gatekeeperVideo;
    frame.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    gatekeeperVideo.append(frame);
  }));

  gatekeeperClose?.addEventListener("click", closeGatekeeper);
  gatekeeperDialog?.addEventListener("close", stopGatekeeper);
  gatekeeperDialog?.addEventListener("click", event => {
    if (event.target === gatekeeperDialog) closeGatekeeper();
  });
})();
