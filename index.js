#!/usr/bin/env node

// Modules qu'on importe pas encore (on le fera plus tard si besoin)
var chalk
var inquirer
var fs
var path
var cliProgress
var download
var notifier
var FormData
var Table
var clipboardy
var extractor
var JSONdb
var config
var axios
var instance
/* =========== */
var platform
var homedir

// Parser les arguments (HAHAHA j'me rends compte le code est horrible eh c'est la faute à copilot)
	// Variable qui contient les arguments par défaut, et ceux parsés
	var defaultArgs = process.argv.slice(2)
	var args = {}

	// Vérifier si l'argument --silent est présent
	if(defaultArgs.includes('--silent') || defaultArgs.includes('-s')) process.env.STEND_SILENT_OUTPUT = true

	// Vérifier si l'argument --disable-notifications est présent
	if(defaultArgs.includes('--disable-notifications') || defaultArgs.includes('-dn')) process.env.STEND_DISABLE_NOTIFICATIONS = true

	// Vérifier si l'argument --disable-spinners est présent
	if(defaultArgs.includes('--disable-spinners') || defaultArgs.includes('-ds')) process.env.STEND_DISABLE_SPINNERS = true
	// Gérer les couleurs en fonction de si les spinners sont activés ou non
	if(process.env.STEND_DISABLE_SPINNERS) chalk = {
		red: (text) => text,
		green: (text) => text,
		blue: (text) => text,
		cyan: (text) => text,
		gray: (text) => text,
		yellow: (text) => text,
		dim: (text) => text,
		reset: (text) => text,
		bold: (text) => text,
	}
	else chalk = require('chalk')

	// Vérifier si l'argument --configpath est présent
	if(defaultArgs.includes('configpath') || defaultArgs.includes('cp') || defaultArgs.includes('--configpath') || defaultArgs.includes('-cp') || defaultArgs.includes('--cp')) return console.log(getConfigPath(true))

	// Vérifier si l'argument --version est présent
	if(defaultArgs.includes('version') || defaultArgs.includes('v') || defaultArgs.includes('--version') || defaultArgs.includes('-v')) return showVersion()

	// Vérifier si l'argument --help est présent
	if(defaultArgs.includes('help') || defaultArgs.includes('h') || defaultArgs.includes('--help') || defaultArgs.includes('-h')) return showHelp()

	// Vérifier si l'argument --history est présent
	if(defaultArgs.includes('history') || defaultArgs.includes('--history')) return showHistory()

	// Vérifier si l'argument --dest est présent
	if(defaultArgs.includes('--dest') || defaultArgs.includes('-f')){
		var value = defaultArgs[defaultArgs.indexOf('--dest') == -1 ? defaultArgs.indexOf('-f') + 1 : defaultArgs.indexOf('--dest') + 1]
		args['dest'] = value
	}

	// Vérifier si l'argument --expire est présent
	if(defaultArgs.includes('--expire') || defaultArgs.includes('-e')){
		var value = defaultArgs[defaultArgs.indexOf('--expire') == -1 ? defaultArgs.indexOf('-e') + 1 : defaultArgs.indexOf('--expire') + 1]
		args['expire'] = value
	}

	// Vérifier si la sous commande upload est présente
	if(defaultArgs.includes('u') || defaultArgs.includes('upload') || defaultArgs.includes('--upload') || defaultArgs.includes('-u')){
		var index = defaultArgs.findIndex(arg => arg === '-u' || arg === '--upload' || arg === 'u' || arg === 'upload');
		var output = []
		if(index != -1) for (let i = index + 1; i < defaultArgs.length; i++){
			if(!defaultArgs[i].startsWith('-')) output.push(defaultArgs[i].endsWith('"') ? defaultArgs[i].substring(0, defaultArgs[i].length - 1) : defaultArgs[i]); else break
		}
		upload(output)
	}

	// Vérifier si la sous commande info est présente
	if(defaultArgs.includes('i') || defaultArgs.includes('info') || defaultArgs.includes('--info') || defaultArgs.includes('-i')){
		var index = defaultArgs.findIndex(arg => arg === '-i' || arg === '--info' || arg === 'i' || arg === 'info');
		var value = defaultArgs[defaultArgs.findIndex(arg => arg === '-i' || arg === '--info' || arg === 'i' || arg === 'info') + 1]
		showTransfertInfo(value)
	}

	// Vérifier si la sous commande download est présente
	if(defaultArgs.includes('d') || defaultArgs.includes('download') || defaultArgs.includes('--download') || defaultArgs.includes('-d')){
		var value = defaultArgs[defaultArgs.findIndex(arg => arg === '-d' || arg === '--download' || arg === 'd' || arg === 'download') + 1]
		downloadFile(value, args?.dest)
	}

	// S'il y a aucune sous commande, afficher l'interface
	if(!defaultArgs.includes('u') && !defaultArgs.includes('upload') && !defaultArgs.includes('--upload') && !defaultArgs.includes('-u') && !defaultArgs.includes('d') && !defaultArgs.includes('download') && !defaultArgs.includes('--download') && !defaultArgs.includes('-d') && !defaultArgs.includes('i') && !defaultArgs.includes('info') && !defaultArgs.includes('--info') && !defaultArgs.includes('-i')) showTUI()

// Afficher la page d'aide
function showHelp(){
	return console.log(`
 Utilisation
   $ stend
   ${chalk.dim('(ou alors "std")')}

 Sous commandes
   help       h              Affiche cette page d'aide
   version    v              Indique la version actuellement utilisée par le CLI
   download   d              Télécharge un ou des fichiers depuis Stend sur votre appareil
   upload     u              Envoie un ou des fichiers de votre appareil sur Stend
   info       i              Affiche les détails d'un transfert à partir de sa clé de partage
   history                   Affiche les précédents transferts effectués
   configpath       -cp      Affiche le chemin du fichier de configuration

 Options
   --silent  -s              Masque certains messages peu utiles dans le terminal
   --dest    -f              Modifier le dossier de destination (download)
   --expire  -e              Choisit une durée avant expiration personnalisée en minutes (upload)
   --disable-notifications   Désactive les notifications sur Windows et macOS
   --disable-spinners        Empêche l'affichage d'animation de chargement dans le terminal

 Télécharger un transfert (peut contenir plusieurs fichiers)
   $ stend download https://stend-web.example.com/d.html?abcdef
   $ stend download abcdef

 Envoyer un fichier
   $ stend upload stickman.png

 Envoyer des fichiers
   $ stend upload homeworks.png jesuis.pdf

 Configurer Stend (obligatoire à la première utilisation)
   $ stend-config # affiche une interface
   $ stend-config get apiBaseLink # affiche l'URL de l'API par exemple
   $ stend-config set apiBaseLink https://stend-api.example.com # défini l'URL de l'API

 Afficher l'assistant (interface via le terminal)
   $ stend
`)
}

// Afficher la version
function showVersion(){
	if(!process.env.STEND_SILENT_OUTPUT){
		console.log("Stend CLI utilise actuellement la version " + chalk.cyan(require('./package.json').version))
		console.log("────────────────────────────────────────────")
		console.log("Développé par Johan le stickman")
		console.log(chalk.cyan("https://johanstick.fr"))
	} else console.log(require('./package.json').version)
	process.exit()
}

// Importer les premiers modules
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

// Vérifier les mises à jour
if(!process.env.STEND_SILENT_OUTPUT && !process.env.STEND_DISABLE_SPINNERS){ // on vérifie si on doit vérifier les MAJ
	const notifierUpdate = updateNotifier({ pkg, updateCheckInterval: 10 }) // on vérifie les MAJ
	if(notifierUpdate.update && pkg.version != notifierUpdate.update.latest){ // si une MAJ est disponible
		console.log(require('boxen')("Mise à jour disponible " + chalk.dim(pkg.version) + chalk.reset(" → ") + chalk.green(notifierUpdate.update.latest) + "\n" + chalk.cyan("npm i -g " + pkg.name) + " pour mettre à jour", {
			padding: 1,
			margin: 1,
			align: 'center',
			borderColor: 'yellow',
			borderStyle: 'round'
		}))

		console.log('\u0007') // Mettre une "notification" (bell)
	}
}

// Afficher un TUI
async function showTUI(){
	// Si on a désactivé les prompts
	if(process.env.STEND_DISABLE_PROMPT) return console.error(chalk.red("Les prompts ont été désactivés via une variable d'environnement. Veuillez utiliser les arguments pour utiliser Stend CLI."))

	// Importer les modules
	inquirer = require('inquirer')
	fs = require('fs')
	path = require('path')

	// Demander les variables à éditer
	var { mode } = await inquirer.prompt([
		{
			type: 'list',
			name: 'mode',
			message: 'Que voulez-vous faire ?',
			choices: ["Télécharger", "Envoyer", "Détails d'un transfert", "Afficher l'historique", fs.existsSync(__dirname+'/config.js') ? "Configurer" : null].filter(Boolean),
			default: 'Télécharger'
		}
	])

	// En fonction du mode, on demande d'autres informations
	switch(mode){
		case "Télécharger":
			var { key } = await inquirer.prompt([
				{
					type: 'text',
					name: 'key',
					message: 'Lien ou clé de partage',
					validate: (value) => {
						if(value.length < 1) return 'Veuillez entrer une clé ou un lien valide'
						return true
					}
				}
			])
			downloadFile(key)
			break
		case "Envoyer":
			var { files } = await inquirer.prompt([
				{
					type: 'input',
					name: 'files',
					message: 'Chemin du fichier (séparés par une virgule pour plusieurs fichiers) :',
					validate: function(value){
						if(!value) return 'Veuillez entrer un chemin valide'
						return true
					}
				}
			])
			upload(files.split(',').map(f => {
				f = f.trim()
				if(f.startsWith('"') || f.startsWith("'")) f = f.substring(1, f.length - 1)
				return path.resolve(f)
			}))
			break
		case "Détails d'un transfert":
			var { key } = await inquirer.prompt([
				{
					type: 'text',
					name: 'key',
					message: 'Lien ou clé de partage',
					validate: (value) => {
						if(value.length < 1) return 'Veuillez entrer une clé ou un lien valide'
						return true
					}
				}
			])
			showTransfertInfo(key)
			break
		case "Afficher l'historique":
			showHistory()
			break
		case "Configurer":
			require('./config.js')
			break
	}
}

// Fonction pour obtenir les informations d'un transfert
async function showTransfertInfo(key){
	// Initialiser la base de données (pour la configuration)
	if(!JSONdb) JSONdb = require('simple-json-db')
	if(!config) config = new JSONdb(getConfigPath(true))

	// Préparer l'URL de l'API
	var apiBaseLink = config.get('apiBaseLink')
	if(!apiBaseLink?.length){
		console.error(chalk.red("Veuillez configurer Stend CLI en tapant " + chalk.blue("stend-config") + " dans votre terminal"))
		process.exit(1)
	}

	// Si c'est une URL et non une clé, on tenter d'en déterminer la clé
	if(key) key = key.trim()
	if(!key?.match(/^[a-zA-Z0-9]+$/)) key = key?.split('d.html?')?.[1] || key
	key = key?.trim().replace(/[^a-zA-Z0-9]/g, '')

	// Si la clé est vide, on quitte
	if(!key?.length){
		console.error(chalk.red("Veuillez entrer une clé de partage, ou un lien vers un téléchargement via le client web."))
		process.exit(1)
	}

	// Importer Axios et créer une instance
	if(!axios) axios = require('axios')
	if(!instance) instance = axios.create({
		baseURL: apiBaseLink,
		timeout: 1000 * 90,
		headers: {
			'User-Agent': 'Stend CLI/' + require('./package.json').version
		},
		validateStatus: (status) => {
			return status >= 200 && status < 500
		}
	})

	// Obtenir les informations du transfert
	var info = await instance.get(`${apiBaseLink}/files/info?sharekey=${key}`).then(res => res.data).catch(err => { return { message: err } })
	if(info.message || info.error || info.statusCode){
		console.error(chalk.red((info.message || info.error || info.statusCode) + '.').replace('La clé de partage est invalide.', "La clé de partage est invalide ou le transfert a pu expirer."))
		process.exit(1)
	}

	// Si c'est un groupe
	var files = []
	if(info.isGroup){
		// Récupérer les informations de chaque fichier
		for(var i = 0; i < info.groups.length; i++){
			var f = await instance.get(`${apiBaseLink}/files/info?sharekey=${info.groups[i]}`).then(res => res.data).catch(err => { return undefined })
			if(!f) return console.warn((process.env.STEND_SILENT_OUTPUT ? '' : chalk.yellow("⚠ ")) + `Le fichier n°${i + 1} n'a pas pu être trouvé. Le serveur externe est peut-être indisponible ?`)
			else if(f.statusCode || f.error || f.message) console.warn((process.env.STEND_SILENT_OUTPUT ? '' : chalk.yellow("⚠ ")) + f.message || f.error || f.statusCode)
			else files.push(f)
		}

		// Si on a aucun fichier
		if(!files.length){
			console.error(chalk.red("Impossible de récupérer les informations des fichiers. Le serveur externe est peut-être indisponible ?"))
			process.exit(1)
		}
	}
	else files.push(info) // Sinon, on ajoute le fichier à la liste

	// On affiche les informations de chaque fichier
	for(var i = 0; i < files.length; i++){
		// Mode silencieux
		if(process.env.STEND_SILENT_OUTPUT){
			files[i].downloadLink = apiBaseLink + files[i].downloadLink
			files[i].cleanFileSize = formatBytes(files[i].fileSize)
			files[i].shareKey = info?.groups?.[i] || key
			console.log(JSON.stringify(files[i]))
			continue
		}

		// Si on a plusieurs fichiers, on affiche le numéro du fichier
		if(files.length > 1) console.log(chalk.cyan("Informations du fichier n°" + (i + 1)))

		// On affiche les informations
		if(files[i].fileName) console.log(chalk.bold("Nom du fichier : ") + chalk.blue(files[i].fileName))
		if(files[i].fileSize) console.log(chalk.bold("Taille du fichier : ") + chalk.blue(formatBytes(files[i].fileSize)))
		if(files[i].uploadedAt) console.log(chalk.bold("Date d'envoi : ") + chalk.blue(new Date(files[i].uploadedAt).toLocaleString()))
		if(files[i].expireDate || files[i].expireTime){
			console.log(chalk.bold("Expiration : "))
			if(files[i].expireDate) console.log("• Date d'expiration : " + chalk.blue(new Date(files[i].expireDate).toLocaleString()))
			if(files[i].expireTime) console.log("• Durée initiale : " + chalk.blue(formatDuration(files[i].expireTime, true)))
		}
		if(files.length > 1) console.log(chalk.bold("Clé de partage : ") + chalk.blue(info.groups[i]))
		if(files[i].downloadLink) console.log(chalk.bold("Lien de téléchargement direct : ") + chalk.blue(apiBaseLink + files[i].downloadLink) + chalk.dim('\n(ce lien expire bientôt, il est conseillé de télécharger le fichier via la sous commande "download")'))

		// Si on a plusieurs fichiers, on saute une ligne
		if(files.length > 1 && i != files.length - 1) console.log()
	}
}

// Fonction pour télécharger
async function downloadFile(key, wherePath){
	// Initialiser la base de données (pour la configuration)
	if(!JSONdb) JSONdb = require('simple-json-db')
	if(!config) config = new JSONdb(getConfigPath(true))

	// Définir le chemin du fichier
	wherePath = wherePath || process.env.STEND_DEFAULT_DOWNLOAD_PATH || path.join(process.cwd()) || path.join(homedir) || '.'

	// Préparer l'URL de l'API
	var apiBaseLink = config.get('apiBaseLink')
	if(!apiBaseLink?.length){
		console.error(chalk.red("Veuillez configurer Stend CLI en tapant " + chalk.blue("stend-config") + " dans votre terminal"))
		process.exit(1)
	}

	// Si c'est une URL et non une clé, on tenter d'en déterminer la clé
	if(key) key = key.trim()
	if(!key?.match(/^[a-zA-Z0-9]+$/)) key = key?.split('d.html?')?.[1] || key
	key = key?.trim().replace(/[^a-zA-Z0-9]/g, '')

	// Si la clé est vide, on quitte
	if(!key?.length){
		console.error(chalk.red("Veuillez entrer une clé de partage, ou un lien vers un téléchargement via le client web."))
		process.exit(1)
	}

	// Importer Axios et créer une instance
	if(!axios) axios = require('axios')
	if(!instance) instance = axios.create({
		baseURL: apiBaseLink,
		timeout: 1000 * 90,
		headers: {
			'User-Agent': 'Stend CLI/' + require('./package.json').version
		},
		validateStatus: (status) => {
		  return status >= 200 && status < 500
		}
	})

	// Obtenir les informations du transfert
	var info = await instance.get(`${apiBaseLink}/files/info?sharekey=${key}`).then(res => res.data).catch(err => { return { message: err } })
	if(info.message || info.error || info.statusCode){
		console.error(chalk.red((info.message || info.error || info.statusCode) + '.'))
		process.exit(1)
	}

	// Si on a déjà le lien de téléchargement
	var transferts = []
	if(info.downloadLink) transferts.push(info)

	// Sinon, on récupère les autres liens de téléchargement
	else if(info.isGroup){
		for(var i = 0; i < info.groups.length; i++){
			var f = await instance.get(`${apiBaseLink}/files/info?sharekey=${info.groups[i]}`).then(res => res.data).catch(err => { return { message: err } })
			if(!f.message && !f.error && !f.statusCode) transferts.push(f)
			else if(i == info.groups.length - 1){
				console.error(chalk.red("Impossible de récupérer les liens de téléchargement de ce groupe. Les fichiers ont peut-être tous expirés ?"))
				process.exit(1)
			}
		}
	}

	// Si on a aucun lien de téléchargement
	if(!transferts.length){
		console.error(chalk.red("Impossible de récupérer les liens de téléchargement. Le serveur externe est peut-être indisponible ?"))
		process.exit(1)
	}

	// Si on a plusieurs liens de téléchargement
	if(transferts.length > 1 && !process.env.STEND_DISABLE_PROMPT){
		if(!inquirer) inquirer = require('inquirer')
		var { transferts } = await inquirer.prompt([
			{
				type: 'checkbox',
				name: 'transferts',
				message: 'Quels fichiers voulez-vous télécharger ?',
				choices: transferts.map(t => ({ name: `${formatBytes(t.fileSize)} | ${t.fileName}`, value: t, checked: true })),
				validate: function(value){
					if(value.length < 1) return 'Veuillez sélectionner au moins un fichier avec la touche espace.'
					return true
				}
			}
		])
	}

	// Importer un module
	if(!download) download = require('nodejs-file-downloader')

	// Télécharger les fichiers
	for(var i = 0; i < transferts.length; i++){
		// Obtenir les informations du transfert
		var { fileName, downloadLink, fileSize } = transferts[i]
		downloadLink = apiBaseLink + downloadLink

		// Si le fichier existe déjà, on demande si on veut le remplacer
		if(fs.existsSync(path.join(wherePath, fileName))){
			var action = await askReplaceFile(path.join(wherePath, fileName))
			if(action == 'ignore'){
				console.warn((process.env.STEND_SILENT_OUTPUT ? '' : chalk.yellow("⚠ ")) + `Le fichier "${chalk.blue(shortenPath(fileName))}" n'a pas été téléchargé car il existe déjà.`)
				continue
			}
			else if(action == 'rename' && !process.env.STEND_DISABLE_PROMPT){
				if(!inquirer) inquirer = require('inquirer')
				var { newFileName } = await inquirer.prompt([
					{
						type: 'text',
						name: 'newFileName',
						message: 'Nouveau nom du fichier',
						default: fileName,
						validate: function(value){
							if(!value) return 'Veuillez entrer un nom de fichier valide'
							return true
						}
					}
				])
				fileName = newFileName
				transferts[i].fileName = newFileName
			}
			else if(action == 'replace') try { fs.unlinkSync(path.join(wherePath, fileName)) } catch (err) { console.warn((process.env.STEND_SILENT_OUTPUT ? '' : chalk.yellow("⚠ ")) + "Le fichier déjà existant n'a pas pu être supprimé.") }
		}

		// Obtenir la barre de progression
		if(!process.env.STEND_SILENT_OUTPUT) var bar = createProgressBar()
		if(bar) bar.start(100, 0, { filename: fileName, firstArg: '0 B', size: formatBytes(fileSize) })

		// Créer le téléchargement
		var file = new download({
			url: downloadLink,
			directory: wherePath,
			fileName: fileName,
			onProgress: function(percentage, chunk, remainingSize){
				if(bar) bar.update(parseFloat(percentage), { firstArg: formatBytes(fileSize - remainingSize) })
				else console.log(JSON.stringify({
					type: 'downloadProgress',
					downloadedClean: formatBytes(fileSize - remainingSize),
					downloaded: fileSize - remainingSize,
					remainingClean: formatBytes(remainingSize),
					remaining: remainingSize,
					percent: parseFloat(percentage),
				}))
			}
		})

		// Commencer le téléchargement
		try {
			await file.download();
			if(bar) await bar.stop()
			if(transferts.length > 1) console.log((process.env.STEND_SILENT_OUTPUT ? '' : chalk.green("✔ ")) + "Un fichier a été téléchargé dans " + chalk.blue(path.join(file.config.directory, file.config.fileName)))
			else console.log((process.env.STEND_SILENT_OUTPUT ? '' : chalk.green("✔ ")) + "Le fichier se trouve dans " + chalk.blue(path.join(file.config.directory, file.config.fileName)))
			transferts[i].downloaded = true
		} catch (err) {
			console.warn((process.env.STEND_SILENT_OUTPUT ? '' : chalk.yellow("⚠ ")) + "Impossible de télécharger ou de finaliser un téléchargement : " + err)
		}
	}

	// Afficher une notification si on a téléchargé au moins un fichier
	if(transferts.filter(t => t.downloaded).length > 0) showNotification("Stend - Téléchargement", transferts.length > 1 ? "Les fichiers ont été téléchargés avec succès." : "Le fichier a été téléchargé avec succès.")

	// Si on a un ou plusieurs fichiers zip, on demande si on veut les extraire
	if(transferts.filter(t => t.fileName.endsWith('.zip')).length > 0 && !process.env.STEND_DISABLE_PROMPT){
		for(var i = 0; i < transferts.length; i++){
			if(transferts[i].downloaded && transferts[i].fileName.endsWith('.zip')){
				if(!inquirer) inquirer = require('inquirer')
				var { extract } = await inquirer.prompt([
					{
						type: 'confirm',
						name: 'extract',
						message: `Voulez-vous extraire le fichier "${chalk.blue(shortenPath(transferts[i].fileName))}" ?`,
						default: true
					}
				])
				if(extract){
					// Importer le module
					if(!extractor) extractor = require('extract-zip')

					// Extraire le fichier
					try {
						await extractor(path.join(wherePath, transferts[i].fileName), { dir: path.resolve(wherePath) })
						console.log((process.env.STEND_SILENT_OUTPUT ? '' : chalk.green("✔ ")) + "Le fichier a été extrait dans " + chalk.blue(path.resolve(wherePath)))
						fs.unlinkSync(path.join(wherePath, transferts[i].fileName))
					} catch (err) {
						console.warn((process.env.STEND_SILENT_OUTPUT ? '' : chalk.yellow("⚠ ")) + "Impossible d'extraire un fichier : " + err)
					}
				}
			}
		}
	}
}

// Fonction pour uploader
async function upload(files){
	// Importer les modules
	if(!fs) fs = require('fs')
	if(!path) path = require('path')

	// Si on a aucun fichier
	if(!files?.length){
		console.error(chalk.red("Veuillez entrer le chemin d'un fichier valide."))
		process.exit(1)
	}

	// Vérifier si les fichiers existent
	for(var i = 0; i < files.length; i++){
		// Si ça finit par une apostrophe ou un guillemet, on l'enlève
		if(files[i].endsWith("'") || files[i].endsWith('"')) files[i] = files[i].substring(0, files[i].length - 1)

		if(files[i] == '*'){ // on ajoute tout les fichiers dans ce dossier
			var dir = path.dirname(files[i])
			var filesInDir = fs.readdirSync(dir)
			files.splice(i, 1)
			filesInDir = filesInDir.filter(f => !fs.statSync(path.join(dir, f)).isDirectory())
			files.push(...filesInDir.map(f => path.join(dir, f)))
		}
		else if(!fs.existsSync(files[i])){
			console.error(chalk.red(`Le fichier "${chalk.blue(shortenPath(files[i]))}" n'existe pas.`))
			process.exit(1)
		}
	}

	// Enlever tout les dossiers
	for(var i = 0; i < files.length; i++){
		try {
			if(fs.statSync(files[i]).isDirectory()){
				console.error(chalk.red(`Le fichier "${chalk.blue(shortenPath(files[i]))}" est un dossier.`))
				process.exit(1)
			}
		} catch (err) {
			console.error(chalk.red(`Impossible de vérifier le fichier "${chalk.blue(shortenPath(files[i]))}".`))
			process.exit(1)
		}
	}
	
	// Enlever les fichiers en double
	files = [...new Set(files)]

	// Initialiser la base de données (pour la configuration)
	if(!JSONdb) JSONdb = require('simple-json-db')
	if(!config) config = new JSONdb(getConfigPath(true))

	// Préparer l'URL de l'API et du client web si disponible
	var webBaseLink = config.get('webBaseLink')
	var apiBaseLink = config.get('apiBaseLink')
	var apiPassword = config.get('apiPassword')
	if(!apiBaseLink?.length){
		console.error(chalk.red("Veuillez configurer Stend CLI en tapant " + chalk.blue("stend-config") + " dans votre terminal"))
		process.exit(1)
	}

	// Importer Axios et créer une instance
	if(!axios) axios = require('axios')
	if(!instance) instance = axios.create({
		baseURL: apiBaseLink,
		timeout: 1000 * 90,
		headers: {
			'User-Agent': 'Stend CLI/' + require('./package.json').version
		},
		validateStatus: (status) => {
		  return status >= 200 && status < 500
		}
	})

	// Obtenir les détails de l'instance
	var instanceInfo = await instance.get(`${apiBaseLink}/instance`).then(res => res.data).catch(err => { return { message: err } })
	if(instanceInfo.message || instanceInfo.error || instanceInfo.statusCode){
		console.error(chalk.red((instanceInfo.message || instanceInfo.error || instanceInfo.statusCode) + '.'))
		process.exit(1)
	}

	// Nombre maximum de fichiers
	if(files.length > (instanceInfo.maxTransfersInMerge || 10)){
		console.error(chalk.red(`Vous ne pouvez pas envoyer plus de ${instanceInfo.maxTransfersInMerge || 10} fichiers à la fois.`))
		process.exit(1)
	}

	// Si on doit indiquer un mot de passe
	if(instanceInfo.requirePassword && !apiPassword?.length){
		console.error(chalk.red("L'API que vous utilisez nécessite un mot de passe. Veuillez le définir en tapant " + chalk.blue("stend-config") + " dans votre terminal"))
		process.exit(1)
	}

	// Obtenir la durée avant expiration
	var expire = parseInt(args['expire']) || parseInt(process.env.STEND_DEFAULT_EXPIRE)

	// Si on l'a pas et qu'on peut afficher un prompt
	if(!expire && !process.env.STEND_DISABLE_PROMPT){
		if(!inquirer) inquirer = require('inquirer')
		var { expire } = await inquirer.prompt([
			{
				type: 'list',
				name: 'expire',
				message: 'Quelle durée avant expiration voulez-vous ?',
				choices: instanceInfo?.recommendedExpireTimes?.map(e => ({ name: e.label, value: e.value })) || [
					{ name: '1 heure', value: 60 },
					{ name: '1 jour', value: 60 * 24 },
					{ name: '1 semaine', value: 60 * 24 * 7 },
					{ name: '1 mois', value: 60 * 24 * 30 },
					{ name: '3 mois', value: 60 * 24 * 30 * 3 },
					{ name: '1 an', value: 60 * 24 * 365 }
				],
				pageSize: 10
			}
		])
	}

	// Si on l'a pas, ou qu'elle est invalide et qu'on ne peut pas afficher de prompt
	else if(!expire || isNaN(expire) || expire < 1 || parseInt(instanceInfo.fileMaxAge) < expire){
		console.error(chalk.red(`Veuillez entrer une durée avant expiration valide et inférieure à ${formatDuration(instanceInfo.fileMaxAge, true)}.`))
	}

	// Importer FormData
	if(!FormData) FormData = require('form-data')

	// Pour chaque fichier à envoyer
	var sendedFiles = []
	for(var i = 0; i < files.length; i++){
		// Récupérer des infos sur le fichier
		var file = {
			name: path.basename(files[i]),
			path: files[i],
			size: fs.statSync(files[i]).size
		}

		// Obtenir la barre de progression
		if(!process.env.STEND_SILENT_OUTPUT) var bar = createProgressBar()
		if(bar) bar.start(100, 0, { filename: file.name, firstArg: '0 B', size: formatBytes(file.size) })

		// Créer le transfert
		let createTransfert = await instance.post(`${apiBaseLink}/files/create`, {
			filename: file.name,
			filesize: file.size,
			expiretime: expire * 60,
		}, { headers: { 'Authorization': apiPassword || '' } }).then(res => res.data).catch(err => { return { message: err } })

		// Si on a pas pu créer le transfert
		if(createTransfert.message || createTransfert.error || createTransfert.statusCode){
			if(bar) bar.stop()
			console.error(chalk.red((createTransfert.message || createTransfert.error || createTransfert.statusCode) + '.'))
			process.exit(1)
		}
		
		// Envoyer tous les chunks qu'on doit envoyer, un par un
		await new Promise(async (resolve, reject) => {
			// Nombre d'octets déjà envoyés
			var alreadySentSize = 0

			for(let i = 0; i < createTransfert.chunks.length; i++){
				// Récupérer les infos sur le chunk
				var chunkInfo = createTransfert.chunks[i]

				// Créer un FormData
				let formData = new FormData()

				// Si on a qu'un seul chunk à envoyer, on ajoute le fichier en entier
				if(createTransfert.chunks.length == 1) formData.append('file', fs.createReadStream(file.path))

				// Sinon, on obtient un chunk et on l'ajoute
				else {
					// On obtient le chunk
					var start = chunkInfo.pos * createTransfert.chunkEvery
					var end = Math.min(start + createTransfert.chunkEvery, file.size)
					let chunkFile = fs.createReadStream(file.path, { start: start, end: end })

					// On ajoute le fichier au FormData
					formData.append('file', chunkFile)
				}

				// On envoie le chunk avec Axios (pour suivre la progression)
				var sendChunk = await instance.put(`${apiBaseLink}${chunkInfo.uploadPath}`, formData, {
					onUploadProgress: progressEvent => {
						let percentCompleted = Math.round((alreadySentSize + progressEvent.loaded) * 100 / file.size)
						if(bar) bar.update(percentCompleted, { firstArg: formatBytes(alreadySentSize + progressEvent.loaded) })
						else console.log(JSON.stringify({
							type: 'uploadProgress',
							uploadedClean: formatBytes(alreadySentSize + progressEvent.loaded),
							uploaded: alreadySentSize + progressEvent.loaded,
							remainingClean: formatBytes(file.size - alreadySentSize - progressEvent.loaded),
							remaining: file.size - alreadySentSize - progressEvent.loaded,
							percent: percentCompleted,
						}))
					}
				}).then(res => res.data).catch(err => { return { error: true, message: err.error || err.message || err } })
				alreadySentSize += chunkInfo.size

				// Tenter de convertir la réponse en JSON
				try { sendChunk = JSON.parse(sendChunk) } catch(e){}

				// Si on a une erreur
				if(sendChunk.error || sendChunk.statusCode){
					if(bar) bar.stop()
					console.log(chalk.red("Une erreur est survenue lors de l'envoi d'un chunk : " + sendChunk.message || sendChunk.error || sendChunk.statusCode || sendChunk))
					return process.exit(1)
				} else if(sendChunk){
					// On ajoute le fichier à l'historique
					addToHistory(file.name, `${webBaseLink ? webBaseLink + '/d.html?' : ''}${sendChunk?.shareKey}`, false, sendChunk?.shareKey)

					// On résout la promesse si on a envoyé tous les chunks
					sendedFiles.push(sendChunk.shareKey)
					resolve()
				}
			}
		})

		// Dire qu'on a fini d'envoyer le fichier
		if(bar) bar.stop()
		if(files.length > 1) console.log((process.env.STEND_SILENT_OUTPUT ? '' : chalk.green("✔ ")) + `Le fichier "${chalk.blue(shortenPath(file.name))}" a été envoyé avec succès.`)
	}

	// Si on avait plusieurs fichiers, on les regroupe
	var mergeTransferts
	if(sendedFiles.length > 1){
		// On regroupe les transferts
		mergeTransferts = await instance.post(`${apiBaseLink}/files/merge`, {
			sharekeys: sendedFiles.join(',')
		}, { headers: { 'Authorization': apiPassword || '' } }).then(res => res.data).catch(err => { return { message: err } })

		// Si on a une erreur
		if(mergeTransferts.message || mergeTransferts.error || mergeTransferts.statusCode){
			console.log(chalk.red("Une erreur est survenue lors de la fusion des transferts : " + mergeTransferts.message || mergeTransferts.error || mergeTransferts.statusCode || mergeTransferts))
			return console.log(sendedFiles.map(key => `${webBaseLink ? webBaseLink + '/d.html?' : ''}${key}`).join(' '))
		}

		// On ajoute le groupe à l'historique
		addToHistory(`${sendedFiles.length} fichiers`, `${webBaseLink ? webBaseLink + '/d.html?' : ''}${mergeTransferts.shareKey}`, true, mergeTransferts?.shareKey)
	}

	// On affiche le lien
	if(!process.env.STEND_SILENT_OUTPUT && sendedFiles.length > 1) console.log() // on saute une ligne pour que ça soit plus propre
	console.log((process.env.STEND_SILENT_OUTPUT ? '' : chalk.green("✔ ")) + "Le lien de partage est :")
	console.log(chalk.cyan(`${webBaseLink ? webBaseLink + '/d.html?' : ''}${mergeTransferts?.shareKey || sendedFiles[0]}`))

	// On affiche une notification
	showNotification("Stend - Envoi", sendedFiles.length > 1 ? `Les fichiers ont été envoyés avec succès.` : `Le fichier a été envoyé avec succès.`)

	// On le copie dans le presse papier
	if(!process.env.STEND_DISABLE_AUTO_WRITE_CLIPBOARD){
		if(!clipboardy) clipboardy = require('clipboardy')
		try {
			clipboardy.writeSync(`${webBaseLink ? webBaseLink + '/d.html?' : ''}${mergeTransferts?.shareKey || sendedFiles[0]}`)
		} catch (err) {} // on ignore les erreurs, comme "Couldn't find the `xsel` binary and fallback didn't work." sur certaines distro Linux
	}

}

// Fonction pour afficher l'historique
async function showHistory(){
	// Importer les modules
	if(!JSONdb) JSONdb = require('simple-json-db')
	if(!config) config = new JSONdb(getConfigPath(true))

	// Si on a pas d'historique, on le crée
	var history = config.get('history')
	if(!history){
		config.set('history', [])
		history = []
	}

	// Si on est en mode silencieux, on affiche un JSON
	if(process.env.STEND_SILENT_OUTPUT){
		console.log(JSON.stringify(history))
		return
	}

	// Importer le module pour les tableaux
	if(!Table) Table = require('cli-table3')

	// Déterminer les tailles des colonnes
	var terminalWidth = process.stdout.columns || 80
	var columnSizes = [
		Math.floor(terminalWidth * 0.25), // Nom
		Math.floor(terminalWidth * 0.08), // Type: doit être court, il ne doit pas prendre de place pour rien
		Math.floor(terminalWidth * 0.1), // Date: un peu moins court, mais faut qu'il ne prenne pas de place inutilement
		Math.floor(terminalWidth * 0.5), // Partage, ça peut être un lien donc il prend de la place
	]

	// Créer le tableau
	var table = new Table({
		head: ['Nom', 'Type', 'Date', 'Partage'],
		wordWrap: true,
		wrapOnWordBoundary: false,
		style: {
			head: [process.env.STEND_DISABLE_SPINNERS ? 'reset' : 'blue'],
			border: [process.env.STEND_DISABLE_SPINNERS ? 'reset' : 'white'],
		},
		colWidths: columnSizes,
	})

	// On affiche l'historique avec un tableau
	if(history.length > 0){
		for(var i = 0; i < history.length; i++){
			table.push([
				history[i].fileName,
				history[i].isGroup ? 'Groupe' : 'Fichier',
				new Date(history[i].date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
				history[i].shareKey ? history[i].link : 'Aucun'
			])
		}
		console.log(table.toString())
	} else console.log(chalk.bold("Aucun fichier dans l'historique."))
}

// Fonction pour obtenir le chemin de la configuration
function getConfigPath(addJsonName=false){
	// Importer les modules
	if(!fs) fs = require('fs')
	if(!path) path = require('path')
	if(!platform) platform = require('os').platform()
	if(!homedir) homedir = require('os').homedir()

	// Définir le chemin de la configuration
	if(platform === "win32") var configPath = path.join(process.env.APPDATA, "johanstickman-cli", "stend")
	else if(platform === "darwin") var configPath = path.join(homedir, "library", "Preferences", "johanstickman-cli", "stend")
	else if(platform === "linux") var configPath = path.join(homedir, ".config", "johanstickman-cli", "stend")
	else var configPath = path.join(homedir, ".johanstickman-cli", "stend")

	// Créer le dossier s'il n'existe pas
	if(!fs.existsSync(configPath)) fs.mkdirSync(configPath, { recursive: true })

	return addJsonName ? path.join(configPath, 'config.json') : configPath
}

// Fonction pour ajouter un fichier à l'historique
function addToHistory(fileName, link, isGroup=false, shareKey){
	// Si c'est désactivé
	if(process.env.STEND_DISABLE_HISTORY) return;

	// Importer les modules
	if(!JSONdb) JSONdb = require('simple-json-db')
	if(!config) config = new JSONdb(getConfigPath(true))

	// Si on a pas d'historique, on le crée
	if(!config.has('history')) config.set('history', [])

	// Si on a trop de fichiers dans l'historique, on ne gardera que les 10 derniers
	var currentHistory = config.get('history')
	if(currentHistory.length >= 10) currentHistory = currentHistory.slice(currentHistory.length - 10)

	// On ajoute le fichier à l'historique
	config.set('history', [...currentHistory, {
		fileName: fileName,
		link: link,
		isGroup: isGroup,
		shareKey: shareKey,
		date: Date.now(),
	}])
}

// Fonction pour gérer une barre de progression
function createProgressBar(){
	// Importer le module
	if(!cliProgress) cliProgress = require('cli-progress')

	// Créer la barre de progression
	var bar = new cliProgress.SingleBar({
		format: `{percentage}%   |{bar}|    {firstArg}/{size}    {filename}`,
		barCompleteChar: '█',
		barIncompleteChar: ' ',
		clearOnComplete: true,
		stopOnComplete: true,
	})

	// Retourner la barre de progression
	return bar
}

// Afficher une notification
async function showNotification(title, message){
	// Si l'OS n'est pas Windows ou macOS, annuler
	if(!platform) platform = require('os').platform()
	if(platform !== "win32" && platform !== "darwin") return;

	// Si les notifications sont désactivées
	if(process.env.STEND_DISABLE_NOTIFICATIONS) return false;

	// Afficher une notification
	if(!notifier) notifier = require('node-notifier')
	notifier.notify({
		title: title,
		message: message,
		sound: false,
		icon: 'Terminal Icon',
		contentImage: 'Terminal Icon',
		install: false,
		timeout: 0,
		wait: false,
	})

	// Mettre une "notification" (bell)
	if(!process.env.STEND_SILENT_OUTPUT) console.log('\u0007');
}

// Convertir une taille en bytes en une taille lisible
function formatBytes(bytes, decimals = 2){
	if(!bytes) return '0 B'
	const k = 1000
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Fonction pour demander si on souhaite remplacer un fichier, le renommer, ou l'ignorer
async function askReplaceFile(filePath){
	// Si on a défini une variable d'environnement pour l'action à faire, on retourne directement cette action
	if(process.env.STEND_ON_CONFLICT == 'replace') return 'replace'
	if(process.env.STEND_ON_CONFLICT == 'rename') return 'rename'
	if(process.env.STEND_ON_CONFLICT == 'ignore') return 'ignore'
	if(process.env.STEND_DISABLE_PROMPT) return 'replace' // si on refuse d'afficher les prompt, on écrase le fichier

	// Importer le module et demander l'action à faire
	if(!inquirer) inquirer = require('inquirer')
	var { action } = await inquirer.prompt([{
		type: 'list',
		name: 'action',
		message: `Le fichier "${chalk.blue(shortenPath(filePath))}" existe déjà, que souhaitez-vous faire ?`,
		choices: [
			{ name: 'Écraser le fichier existant', value: 'replace' },
			{ name: 'Enregistrer sous un autre nom', value: 'rename' },
			{ name: 'Ne pas télécharger', value: 'ignore' },
		]
	}])

	return action
}

// Fonction pour raccourcir le chemin de l'utilisateur par "~"
function shortenPath(filepath){
	if(!homedir) homedir = require('os').homedir()
	filepath = path.relative(process.cwd(), filepath)
	return filepath.replace(homedir, '~')
}

// Convertir une durée en secondes en une durée lisible
function formatDuration(seconds, complete=false){
	if(!seconds) return '0s'
	var result = ''
	var s = Math.floor(seconds % 60)
	var m = Math.floor(seconds / 60) % 60
	var h = Math.floor(seconds / 3600) % 24
	var d = Math.floor(seconds / 86400)
	if(d) result += `${d}${complete && d > 1 ? ' jours' : complete ? ' jour' : 'j'} `
	if(h) result += `${h}${complete && h > 1 ? ' heures' : complete ? ' heure' : 'h'} `
	if(m) result += `${m}${complete && m > 1 ? ' minutes' : complete ? ' minute' : 'm'} `
	if(s) result += `${s}${complete && s > 1 ? ' secondes' : complete ? ' seconde' : 's'} `
	return result.trim()
}
