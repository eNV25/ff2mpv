function ff2mpv(url, tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: true },
    func: () => {
      document.querySelectorAll("video").forEach((video) => video.pause());
    },
  });
  chrome.runtime
    .sendNativeMessage("ff2mpv", { url: url })
    .catch((error) => console.log(`${error}`));
}

chrome.runtime.onInstalled.addListener((_) => {
  chrome.contextMenus.create({
    id: "ff2mpv",
    title: "Play in MPV",
    contexts: ["link", "image", "video", "audio", "selection", "frame"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "ff2mpv":
      /* These should be mutually exclusive, but,
       * if they aren't, this is a reasonable priority. */
      const url =
        info.linkUrl || info.srcUrl || info.selectionText || info.frameUrl;
      if (url) ff2mpv(url, tab.id);
      break;
  }
});

chrome.action.onClicked.addListener((tab) => {
  ff2mpv(tab.url, tab.id);
});
