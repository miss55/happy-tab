# Tabvia

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | [Español](./README.es.md) | **Français** | [Deutsch](./README.de.md)

Tabvia est un gestionnaire de favoris qui remplace la page de nouvel onglet du navigateur. La version actuelle de l’extension est **0.2.5**. Consultez le [journal des modifications](./CHANGELOG.md).

Enregistrez et classez vos liens localement, importez ou exportez une sauvegarde JSON et, si vous le souhaitez, synchronisez un instantané avec un stockage externe que vous gérez. Tabvia privilégie le stockage local : aucune connexion à un compte ni aucun serveur propre au produit ne sont nécessaires. L’interface est disponible en anglais, chinois simplifié, chinois traditionnel, japonais, coréen, espagnol, français et allemand.

Ce dépôt utilise un workspace pnpm. Le produit est l’extension Manifest V3 située dans `apps/extension`. Les favoris de Tabvia sont indépendants de la barre de favoris intégrée au navigateur.

- Code source : [miss55/happy-tab](https://github.com/miss55/happy-tab)
- Signalement de problèmes : [GitHub Issues](https://github.com/miss55/happy-tab/issues)
- Politique de confidentialité : [page publique](https://miss55.github.io/happy-tab/privacy-policy.html)

## Structure du dépôt

- `apps/extension` : extension Chrome MV3 développée avec Vite, Vue 3 et TypeScript.
- `docs` : documentation du produit et de son architecture.

## Développement

Exécutez ces commandes à la racine du dépôt :

```sh
# Installer les dépendances
pnpm install
# Démarrer le serveur de développement
pnpm dev:extension
# Valider le manifeste de l’extension
pnpm check:manifest
# Exécuter les tests du frontend
pnpm test
# Compiler l’extension (avec vérification TypeScript)
pnpm build:extension
```

Activez le mode développeur dans `chrome://extensions` (Chrome) ou `edge://extensions` (Edge), chargez `apps/extension/dist` en tant qu’extension non empaquetée, puis ouvrez un nouvel onglet.

Consultez le [guide de publication](./docs/store-listing.md) pour préparer le paquet destiné au Chrome Web Store et à Microsoft Edge Add-ons, ainsi que la [documentation sur la confidentialité](./docs/privacy-policy.md) pour la politique exigée par ces boutiques. Après avoir configuré GitHub Pages pour publier `docs/` depuis la branche `main`, vous pouvez renseigner `https://miss55.github.io/happy-tab/privacy-policy.html` dans les tableaux de bord des deux boutiques.

## Fonctionnalités actuelles

Le MVP local de la page de nouvel onglet et la synchronisation facultative d’instantanés vers un stockage externe sont implémentés.

- Remplace la page de nouvel onglet de Chrome. Le même paquet fonctionne dans Microsoft Edge.
- Affiche les onglets ouverts par fenêtre et permet d’y accéder ou de les fermer.
- Conserve les groupes de liens, les liens et les tâches dans IndexedDB. Les accès aux données passent par la couche de dépôts et Dexie.
- Permet de créer, renommer, supprimer et réorganiser les groupes de liens par glisser-déposer.
- Organise les groupes dans des pages de favoris : création, renommage, réorganisation et suppression des pages vides, avec déplacement de groupes ou de liens entre pages depuis les commandes de modification. La navigation rapide, les onglets du navigateur et la liste facultative de tâches sont partagés.
- Enregistre un onglet comme lien grâce à un bouton ou en le déposant dans un groupe. Les liens peuvent aussi être ajoutés en saisissant leur URL.
- Ouvre les liens enregistrés dans un nouvel onglet et mémorise le nombre d’ouvertures et la date de la dernière ouverture.
- Permet de réorganiser les liens par glisser-déposer au sein d’un groupe ou entre groupes.
- Permet de créer, terminer, réactiver, modifier, supprimer et réorganiser les tâches. La liste est masquée par défaut et peut être activée dans Importer / Exporter.
- Propose huit langues, détecte celle du navigateur et mémorise localement le choix manuel.
- Exporte des sauvegardes JSON versionnées et importe les données validées par fusion ou remplacement. Pages, groupes, liens, tâches, statistiques d’utilisation et raccourcis de navigation rapide sont inclus. Le format v2 préserve l’appartenance aux pages et les sauvegardes v1 restent acceptées.
- Propose les thèmes Soft, Minimal, Glass, Fluent, OLED et Cyber ; les modes clair, sombre et système ; des couleurs d’accentuation ; des fonds inclus et un fond personnalisé local. L’apparence enregistrée est appliquée avant le chargement de l’application.
- Affiche une barre de navigation rapide au-dessus des favoris. Ajoutez des raccourcis par URL ou en y déposant des onglets ou des liens enregistrés ; réorganisez-les, modifiez-les, supprimez-les et annulez une suppression pendant la session actuelle de la page.
- Dispose les groupes dans une grille de type masonry et leur attribue des couleurs d’en-tête pastel, modifiables par groupe.
- Propose une synchronisation facultative avec votre propre Upstash Redis, GitHub Gist, Cloudflare KV, JSONBin ou point de terminaison REST personnalisé. Les instantanés incluent les pages de favoris et les raccourcis de navigation rapide.

Mettez à jour tous les appareils synchronisés avant d’utiliser plusieurs pages de favoris : les anciens clients ne peuvent pas préserver les collections de pages. Consultez le [guide des pages de favoris](./docs/bookmark-pages.md) pour la migration et la compatibilité des sauvegardes et de la synchronisation.

Améliorations ou vérifications à poursuivre :

- Étendre la couverture automatisée au-delà des tests unitaires et des vérifications des pages et thèmes dans le navigateur.
- Effectuer une régression complète de l’extension non empaquetée dans Chrome et Edge.

La synchronisation des favoris natifs du navigateur ne fait pas partie du périmètre actuel.

## Langues de la documentation

Les liens en haut de page donnent accès à ce README dans les huit langues de l’interface. Le guide de développement de l’extension, le journal des modifications et les documents détaillés de `docs/` sont actuellement en anglais.

## Licence

[MIT](./LICENSE)
