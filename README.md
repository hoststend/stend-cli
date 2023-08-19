# Stend | CLI

Stend est un projet visant à être l'une des meilleures solutions pour configurer son propre service de partage de fichiers. Il a été conçu pour être aussi complet que la plupart des services propriétaires, mais avec une facilité d'installation et de configuration incomparable aux autres projets open-source.

Ce repo GitHub contient le code source du client pour terminal de Stend, permettant de télécharger ou d'envoyer des fichiers sur une instance de Stend.

> Pour plus d'informations sur ce client, vous pouvez lire [la page de la documentation dédiée](https://stend-docs.johanstick.me/web-docs/selfhost).

## Prérequis

* [nodejs v15+ et npm](https://nodejs.org/en/) installé sur votre système.
* Un appareil sous Windows, macOS, Linux ou ChromeOS


## Installation

```bash
$ (sudo) npm install --global stend-cli
```


## Commandes disponibles

* `stend`, `std` : commande principale
* `stend-config` : permet de configurer Stend, pour se connecter à une instance par exemple


## Variables d'environnements

Vous pouvez modifier certains paramètres du client Stend pour terminal grâce aux variables d'environnements suivantes :

| Nom                                  | Description                                                                       | Valeur acceptée               |
|--------------------------------------|-----------------------------------------------------------------------------------|-------------------------------|
| `STEND_SILENT_OUTPUT`                | Désactive l'affichage de certains textes dans le terminal, ou l'affiche au format JSON     | N'importe                     |
| `STEND_DISABLE_NOTIFICATIONS`        | Désactive les notifications système lors du téléchargement ou de l'envoi d'un fichier      | N'importe                     |
| `STEND_DEFAULT_DOWNLOAD_PATH`        | Modifie le chemin par défaut utilisé pour enregistrer un fichier                           | Chemin d'un dossier           |
| `STEND_ON_CONFLICT`                  | Action à effectuer automatiquement lorsqu'on télécharge un fichier déjà existant (`rename` ne fonctionne pas en mode silencieux)  | `replace`, `rename`, `ignore` |
| `STEND_DISABLE_AUTO_WRITE_CLIPBOARD` | Désactive la copie du lien de partage dans le presse-papier lors d'un envoi                | N'importe                     |
| `STEND_DISABLE_PROMPT`               | Empêche l'affichage de prompt (= quand le CLI propose un choix à remplir avec le clavier)  | N'importe                     |
| `STEND_DISABLE_SPINNERS`             | Empêche l'affichage de barre de progression dans le terminal                               | N'importe                     |
| `STEND_DISABLE_HISTORY`              | Désactive l'ajout des fichiers envoyés dans l'historique de transferts                     | N'importe                     |
| `STEND_DEFAULT_EXPIRE`               | Durée par défaut avant qu'un transfert n'expire, --expire passe en priorité                | Nombre                        |

> Les variables contenant "N'importe" comme valeur acceptée peuvent être activées en définissant une valeur (n'importe laquelle), ou désactivés (ne pas définir de valeur).


## En lien

* [Stend API](https://github.com/johan-perso/stend-api) / [Stend WEB](https://github.com/johan-perso/stend-web) - pour configurer une instance de Stend
* [SendOverNetwork](https://github.com/johan-perso/sendovernetwork) - permet de s'échanger des fichiers via terminal sur le même réseau


## Licence

MIT © [Johan](https://johanstick.me)