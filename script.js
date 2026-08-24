(() => {
  "use strict";
  const config = window.HOP_EVENT || {};
  const clean = value => typeof value === "string" ? value.trim() : "";
  const values = {
    marketName: clean(config.marketName),
    marketAddress: clean(config.marketAddress),
    eventDate: clean(config.eventDate),
    eventTime: [clean(config.startTime), clean(config.endTime)].filter(Boolean).join(" to "),
    contactEmail: clean(config.contactEmail)
  };
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail);

  document.querySelectorAll("[data-event]").forEach(node => {
    const key = node.dataset.event;
    const value = values[key];
    if (!value) return;
    if (key === "contactEmail" && validEmail) {
      const link = document.createElement("a");
      link.href = `mailto:${value}`;
      link.textContent = value;
      node.replaceChildren(link);
    } else node.textContent = value;
  });

  const hasLocation = values.marketName && values.marketAddress;
  if (hasLocation && values.eventDate) {
    document.querySelector("#event-status").textContent = "We would love to meet you there.";
  }

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

  const form = document.querySelector("#interest-form");
  const button = document.querySelector("#submit-button");
  const message = document.querySelector("#form-message");
  if (!form || !button || !message) return;

  if (validEmail) {
    button.disabled = false;
    message.textContent = "Submitting opens your email app. This website does not store your details.";
    message.classList.add("ready");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    message.classList.remove("error");
    if (!validEmail) {
      message.textContent = "Contact details are coming soon.";
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      message.textContent = "Please complete the required fields and confirmations.";
      message.classList.add("error");
      return;
    }
    const data = new FormData(form);
    const subject = `Hop for the Prize interest: ${data.get("rabbit")}`;
    const body = [
      "Hello The Gatekeeper,", "", "I’m interested in the friendly bunny-hopping pop-up.", "",
      `Owner’s name: ${data.get("owner")}`,
      `Email: ${data.get("email")}`,
      `Rabbit’s name: ${data.get("rabbit")}`,
      `Rabbit’s approximate age: ${data.get("age")}`,
      `Notes: ${data.get("notes") || "None"}`, "",
      "I understand that The Gatekeeper supervises the course and I will stay with my rabbit at all times.",
      "I understand that participation is voluntary and can stop at any time."
    ].join("\n");
    window.location.href = `mailto:${values.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    message.textContent = "Your email app should now open. Nothing was sent or stored by this website.";
  });
})();
