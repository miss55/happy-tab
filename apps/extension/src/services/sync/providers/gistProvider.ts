import type { StorageProvider, SyncProviderConfig, SyncSnapshot } from "../types";
import { decryptPayload, encryptPayload } from "../encryption";

const DEFAULT_FILENAME = "happy_tab_sync.json";

export class GistProvider implements StorageProvider {
  readonly type = "gist";
  readonly name = "GitHub Gist";

  private getFilename(config: SyncProviderConfig): string {
    return config.gist.filename?.trim() || DEFAULT_FILENAME;
  }

  async testConnection(config: SyncProviderConfig): Promise<boolean> {
    const { token, gistId } = config.gist;
    if (!token || !gistId) return false;

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: "application/vnd.github+json"
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullSnapshot(config: SyncProviderConfig): Promise<SyncSnapshot | null> {
    const { token, gistId } = config.gist;
    if (!token || !gistId) throw new Error("GitHub Token and Gist ID are required.");

    const filename = this.getFilename(config);
    const response = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Gist pull failed with status ${response.status}`);
    }

    const gistData = await response.json();
    const fileObj = gistData.files?.[filename];

    if (!fileObj || !fileObj.content) {
      return null;
    }

    const decryptedStr = await decryptPayload(fileObj.content, config.encryptionKey);
    return JSON.parse(decryptedStr) as SyncSnapshot;
  }

  async pushSnapshot(config: SyncProviderConfig, snapshot: SyncSnapshot): Promise<boolean> {
    const { token, gistId } = config.gist;
    if (!token || !gistId) throw new Error("GitHub Token and Gist ID are required.");

    const filename = this.getFilename(config);
    const jsonStr = JSON.stringify(snapshot);
    const payloadContent = await encryptPayload(jsonStr, config.encryptionKey);

    const response = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: {
          [filename]: {
            content: payloadContent
          }
        }
      })
    });

    return response.ok;
  }
}
