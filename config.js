#!/usr/bin/env node

// Fonction pour obtenir le chemin de la configuration
function getConfigPath(addJsonName=false){
	// Importer les modules
	var fs = require('fs')
	var path = require('path')
	var { platform, homedir } = require('os')

	// Définir le chemin de la configuration
	if(platform() === "win32") var configPath = path.join(process.env.APPDATA, "johanstickman-cli", "stend")
	else if(platform() === "darwin") var configPath = path.join(homedir(), "library", "Preferences", "johanstickman-cli", "stend")
	else if(platform() === "linux") var configPath = path.join(homedir(), ".config", "johanstickman-cli", "stend")
	else var configPath = path.join(homedir(), ".johanstickman-cli", "stend")

	// Créer le dossier s'il n'existe pas
	if(!fs.existsSync(configPath)) fs.mkdirSync(configPath, { recursive: true })

	return addJsonName ? path.join(configPath, 'config.json') : configPath
}

// Fonction pour trim
function trim(str){
	return str.replace(/^\s+|\s+$/gm,'').trim()
}

// Modifier la variable
const JSONdb = require('simple-json-db')
const config = new JSONdb(getConfigPath(true))

// Parser les arguments
	// Variable qui contient les arguments par défaut, et ceux parsés
	var defaultArgs = process.argv.slice(2)
	var method = defaultArgs?.[0]
	var key = defaultArgs?.[1]
	var value = defaultArgs?.[2]

	// Si on veut définir
	if(method == 'set'){
		if(!key || !value) return console.log('Veuillez spécifier une clé et une valeur. Exemple: stend-config set apiBaseLink https://stend-api.example.com')

		config.set(key, value)
		console.log('La variable a été définie avec succès !')
	}

	// Si on veut supprimer
	else if(method == 'delete'){
		if(!key) return console.log('Veuillez spécifier une clé. Exemple: stend-config delete apiBaseLink')

		config.delete(key)
		console.log('La variable a été supprimée avec succès !')
	}

	// Si on veut obtenir
	else if(method == 'get'){
		if(!key) return console.log('Veuillez spécifier une clé. Exemple: stend-config get apiBaseLink')

		console.log(config.get(key))
	}

	// Si on veut lister
	else if(method == 'list') console.log('Voici la liste des variables de configuration: apiBaseLink, apiPassword, webBaseLink')

	// Si on veut voir le chemin de la configuration
	else if(method == 'path') console.log(getConfigPath(true))

	// Sinon on affiche une interface
	else showTUI()

// Afficher un TUI pour demander les variables à éditer
async function showTUI(){
	// Importer les modules
	const inquirer = require('inquirer')
	const axios = require('axios')

	// Supprimer les valeurs déjà existantes
	config.delete('apiBaseLink')
	config.delete('apiPassword')
	config.delete('webBaseLink')

	// Créer une instance axios
	var instance = axios.create({
		timeout: 1000 * 90,
		headers: {
			'User-Agent': 'Stend CLI/' + require('./package.json').version
		},
		validateStatus: (status) => {
			return status >= 200 && status < 500
		}
	})

	// Variables
	var apiUrl

	// Demander les variables à éditer
	var { webUrl } = await inquirer.prompt([
		{
			type: 'input',
			name: 'webUrl',
			message: 'URL du client WEB si disponible (laissez vide pour ignorer)'
		}
	])

	// Si on a l'URL du client web, on la fetch pour obtenir celle de l'API
	if(webUrl){
		// Si ça commence pas par http, on ajoute
		if(!webUrl.startsWith('http')) webUrl = 'https://' + webUrl

		// Faire une requête
		var webUrlContent = await instance.get(webUrl).catch(() => null)

		// Si on a pas de réponse, on affiche une erreur
		if(!webUrlContent) return console.log("Impossible de se connecter au client web. Vérifier que l'URL est correcte.")

		// Si on a une réponse, on cherche l'URL de l'API
		if(webUrlContent?.data) apiUrl = webUrlContent.data.match(/ apibaseurl="https:\/\/(.*)"/)?.[1]
		if(apiUrl) apiUrl = 'https://' + apiUrl.split('"')[0]
	}

	// Demander l'URL de l'API
	var { apiUrl } = await inquirer.prompt([
		{
			type: 'input',
			name: 'apiUrl',
			message: 'URL de l\'API',
			default: apiUrl,
			validate: (input) => {
				if(!input) return 'Vous devez spécifier une URL.'
				if(input?.length < 3) return 'Vous devez spécifier une URL valide.'
				return true
			}
		}
	])

	// On obtient le protocole dans l'URL
	var apiProtocol = apiUrl.split('://')[0]
	if(apiProtocol != "http" && apiProtocol != "https"){
		var { apiProtocol } = await inquirer.prompt([
			{
				type: 'list',
				name: 'apiProtocol',
				message: "Vous devez choisir le protocole utilisé par l'API",
				choices: ['https', 'http']
			}
		])
		apiUrl = apiProtocol + '://' + (apiUrl.split('://')[1] || apiUrl)
	}

	// On vérifie que l'instance soit bien une instance Stend
	var apiDomainContent = await instance.get(`${apiUrl}/instance`).catch(() => null)
	if(!apiDomainContent?.data) return console.log("Impossible de se connecter à l'API. Vérifier que l'URL est correcte.")

	// On demande le mot de passe
	if(apiDomainContent.data?.requirePassword) var { apiPassword } = await inquirer.prompt([
		{
			type: 'password',
			name: 'apiPassword',
			message: 'Mot de passe de l\'API',
			validate: (input) => {
				if(!input) return 'Vous devez spécifier un mot de passe.'
				return true
			}
		}
	])

	// On vérifie le mot de passe
	if(apiPassword){
		var checkPassword = await instance.post(`${apiUrl}/checkPassword`, null, { headers: { Authorization: apiPassword } }).catch(() => null)
		if(!checkPassword?.data) return console.log("Impossible de se connecter à l'API. Vérifier que l'URL est correcte.")
		if(!checkPassword.data?.success) return console.log(checkPassword?.data?.message || "Le mot de passe est incorrect.")
	}

	// On enregistre les variables
	config.set('apiBaseLink', trim(apiUrl))
	if(apiPassword) config.set('apiPassword', trim(apiPassword))
	if(webUrl) config.set('webBaseLink', trim(webUrl))

	// On affiche un message
	console.log('Stend est désormais prêt à être utilisé !')
}