import {
  EXTENSION_FETCH_MESSAGE_TYPE,
  performPrivilegedFetch,
  type ExtensionFetchRequest
} from "@/services/extensionFetch";

chrome.runtime.onMessage.addListener((message: ExtensionFetchRequest, _sender, sendResponse) => {
  if (message?.type !== EXTENSION_FETCH_MESSAGE_TYPE) {
    return false;
  }

  void performPrivilegedFetch(message).then(sendResponse);
  return true;
});
