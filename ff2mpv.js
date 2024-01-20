const contexts = ["link", "image", "video", "audio", "selection", "frame"];
const CREATE_PROFILE = 'createProfile';
const UPDATE_PROFILE = 'updateProfile';
const DELETE_PROFILE = 'deleteProfile';

function onError(error) {
  console.log(`${error}`);
}

function ff2mpv(url, tabId, options = []) {
  chrome.scripting.executeScript({
    target: { tabId: tabId, allFrames: true },
    func: () => {
      document.querySelectorAll("video").forEach((video) => video.pause());
    },
  });
  chrome.runtime
    .sendNativeMessage("ff2mpv", { url, options })
    .catch(onError);
}

async function getOS() {
  return chrome.runtime.getPlatformInfo().then((i) => i.os);
}

async function getProfiles() {
  return (await chrome.storage.sync.get('profiles'))['profiles'] || [];
};

async function getOptions(id) {
  const profiles = await getProfiles();
  const profile = profiles.find(pf => pf.id === id);

  // If profile, remove empty lines
  return profile
    ? profile.content.filter(line => !!line)
    : [];
}

async function submenuClicked(info, tab) {
  switch (info.parentMenuItemId) {
    case "ff2mpv":
      /* These should be mutually exclusive, but,
         if they aren't, this is a reasonable priority.
      */
      url = info.linkUrl || info.srcUrl || info.selectionText || info.frameUrl;
      if (url) {
        const options = await getOptions(info.menuItemId);
        ff2mpv(url, tab.id, options);
      }
    break;
  }
}

function createProfile(profile) {
  chrome.contextMenus.create({
    parentId: "ff2mpv",
    id: profile.id,
    title: profile.name,
    contexts,
  })
}

function deleteProfile(menuItemId) {
  chrome.contextMenus.remove(menuItemId);
}

function updateProfile(profile) {
  chrome.contextMenus.update(profile.id, {
    title: profile.name,
  });
}

chrome.runtime.onInstalled.addListener(async (_) => {
  // TODO: Should we have os detection?
  // var title = os == "win" ? "Play in MP&V" : "Play in MPV (&W)";
  chrome.contextMenus.create({
    id: "ff2mpv",
    title: "Play in MPV",
    contexts,
  });

  const profiles = await getProfiles();

  profiles.forEach(profile => {
    createProfile(profile);
  });
});

chrome.contextMenus.onClicked.addListener(submenuClicked);

chrome.action.onClicked.addListener((tab) => {
  ff2mpv(tab.url, tab.id);
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!request) {
    console.wanr('No request in message');
    return;
  }

  const { type, profile } = request;

  switch (type) {
    case CREATE_PROFILE:
      createProfile(profile);
      break;
    case UPDATE_PROFILE:
      updateProfile(profile);
      break;
    case DELETE_PROFILE:
      deleteProfile(profile.id);
      break;
    default:
      console.warn('No handler for type:', type);
      return;
  }
});
