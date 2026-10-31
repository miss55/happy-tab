# Tabvia

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Español](./README.es.md) | [Français](./README.fr.md) | **Deutsch**

Tabvia ist eine Lesezeichenverwaltung, die die Seite für neue Tabs im Browser ersetzt. Die aktuelle Erweiterungsversion ist **0.2.5**. Details stehen im [Änderungsprotokoll](./CHANGELOG.md).

Speichere und gruppiere Links lokal, importiere oder exportiere JSON-Sicherungen und synchronisiere bei Bedarf einen Daten-Snapshot mit einem externen Speicher, den du selbst verwaltest. Tabvia setzt auf lokale Speicherung: Eine Anmeldung und ein eigener Backend-Dienst sind nicht erforderlich. Die Oberfläche unterstützt Englisch, vereinfachtes Chinesisch, traditionelles Chinesisch, Japanisch, Koreanisch, Spanisch, Französisch und Deutsch.

Dieses Repository verwendet einen pnpm-Workspace. Das Produkt ist die Manifest-V3-Erweiterung in `apps/extension`. Die Lesezeichen von Tabvia sind unabhängig von der integrierten Lesezeichenleiste des Browsers.

- Quellcode: [miss55/happy-tab](https://github.com/miss55/happy-tab)
- Fehler melden: [GitHub Issues](https://github.com/miss55/happy-tab/issues)
- Datenschutz: [veröffentlichte Datenschutzerklärung](https://miss55.github.io/happy-tab/privacy-policy.html)

## Repository-Struktur

- `apps/extension`: Chrome-MV3-Erweiterung mit Vite, Vue 3 und TypeScript.
- `docs`: Produkt- und Architekturdokumentation.

## Entwicklung

Führe diese Befehle im Stammverzeichnis des Repositorys aus:

```sh
# Abhängigkeiten installieren
pnpm install
# Entwicklungsserver starten
pnpm dev:extension
# Erweiterungsmanifest prüfen
pnpm check:manifest
# Frontend-Tests ausführen
pnpm test
# Erweiterung bauen (einschließlich TypeScript-Prüfung)
pnpm build:extension
```

Aktiviere unter `chrome://extensions` (Chrome) oder `edge://extensions` (Edge) den Entwicklermodus, lade `apps/extension/dist` als entpackte Erweiterung und öffne einen neuen Tab.

Die [Anleitung zur Store-Veröffentlichung](./docs/store-listing.md) beschreibt die Paketvorbereitung für den Chrome Web Store und Microsoft Edge Add-ons. Die erforderliche Datenschutzerklärung ist in der [Datenschutzdokumentation](./docs/privacy-policy.md) beschrieben. Nachdem GitHub Pages für `docs/` im Branch `main` aktiviert wurde, kannst du `https://miss55.github.io/happy-tab/privacy-policy.html` in beiden Store-Dashboards hinterlegen.

## Aktuelle Funktionen

Das lokale MVP für die neue Tab-Seite und die optionale Snapshot-Synchronisierung mit externem Cloud-Speicher sind implementiert.

- Ersetzt die neue Tab-Seite von Chrome. Dasselbe Paket funktioniert auch in Microsoft Edge.
- Zeigt offene Browser-Tabs nach Fenster gruppiert an und ermöglicht das Wechseln zu Tabs und deren Schließen.
- Speichert Linkgruppen, gespeicherte Links und Aufgaben in IndexedDB. Datenzugriffe erfolgen über die Repository-Schicht und Dexie.
- Unterstützt das Erstellen, Umbenennen, Löschen und Sortieren von Linkgruppen per Drag-and-drop.
- Ordnet Gruppen in Lesezeichenseiten: Seiten erstellen, umbenennen, umsortieren und leere Seiten löschen; Gruppen oder Links lassen sich über ihre Bearbeitungsfelder auf andere Seiten verschieben. Schnellnavigation, Browser-Tabs und die optionale Aufgabenliste bleiben gemeinsam nutzbar.
- Speichert Browser-Tabs per Schaltfläche oder durch Ziehen in eine Linkgruppe als Links. Links können auch durch Eingabe einer URL hinzugefügt werden.
- Öffnet gespeicherte Links in einem neuen Tab und erfasst die Anzahl der Aufrufe sowie den Zeitpunkt des letzten Aufrufs.
- Sortiert gespeicherte Links per Drag-and-drop innerhalb einer Gruppe und zwischen Gruppen.
- Unterstützt das Erstellen, Erledigen, Wiederöffnen, Bearbeiten, Löschen und Sortieren von Aufgaben. Die Liste ist anfangs ausgeblendet und kann unter Import / Export aktiviert werden.
- Bietet acht Oberflächensprachen, erkennt die Browsersprache und speichert eine manuelle Auswahl lokal.
- Exportiert versionierte JSON-Sicherungen und importiert geprüfte Daten durch Zusammenführen oder Ersetzen. Enthalten sind Seiten, Gruppen, Links, Aufgaben, Nutzungsstatistiken und Schnellzugriffe. Format v2 erhält die Seitenzuordnung; Sicherungen im Format v1 bleiben lesbar.
- Bietet die Designs Soft, Minimal, Glass, Fluent, OLED und Cyber, helle und dunkle Darstellung sowie den Systemmodus, Akzentfarben, mitgelieferte Hintergrundbilder und einen eigenen lokalen Hintergrund. Das gespeicherte Erscheinungsbild wird vor dem Laden der Anwendung angewendet.
- Zeigt oberhalb der Lesezeichen eine Schnellnavigation. Schnellzugriffe lassen sich per URL oder durch Ziehen von Browser-Tabs oder gespeicherten Links hinzufügen, sortieren, bearbeiten und entfernen. Eine Entfernung lässt sich während der aktuellen Seitensitzung rückgängig machen.
- Ordnet Linkgruppen in einem Masonry-Raster an und weist den Überschriften automatisch Pastellfarben zu, die pro Gruppe angepasst werden können.
- Synchronisiert auf Wunsch mit deinem eigenen Upstash Redis, GitHub Gist, Cloudflare KV, JSONBin oder einem benutzerdefinierten REST-Endpunkt. Snapshots enthalten auch Lesezeichenseiten und Schnellzugriffe.

Aktualisiere alle synchronisierten Geräte, bevor du mehrere Lesezeichenseiten verwendest: Ältere Clients können Seitensammlungen nicht erhalten. Hinweise zu Migration, Sicherungen und Synchronisierung stehen in der [Dokumentation zu Lesezeichenseiten](./docs/bookmark-pages.md).

Noch zu verbessern oder zu prüfen:

- Breitere automatisierte Abdeckung über die vorhandenen Unit-Tests und Browserprüfungen für Seiten und Designs hinaus.
- Vollständige Regressionstests der entpackten Erweiterung in Chrome und Edge.

Die Synchronisierung nativer Browser-Lesezeichen gehört nicht zum aktuellen Funktionsumfang.

## Sprachen der Dokumentation

Über die Links oben ist diese README in allen acht Oberflächensprachen verfügbar. Die Entwicklungsanleitung der Erweiterung, das Änderungsprotokoll und die ausführlichen Dokumente unter `docs/` sind derzeit auf Englisch.

## Lizenz

[MIT](./LICENSE)
