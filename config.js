#!/usr/bin/env node

// Parser les arguments (HAHAHA j'me rends compte le code est horrible eh c'est la faute à copilot)
	// Variable qui contient les arguments par défaut, et ceux parsés
	var defaultArgs = process.argv.slice(2)
	var key, value

	// Si on veut définir
	if(defaultArgs?.[0] == 'set'){
		key = defaultArgs?.[1]
		value = defaultArgs?.[2]
		if(!key || !value) return console.log('Veuillez spécifier une clé et une valeur. Exemple: stend-config set apiBaseLink https://stend-api.example.com')
		main()
	}

	// Si on veut obtenir
	else if(defaultArgs?.[0] == 'get'){
		key = defaultArgs?.[1]
		if(!key) return console.log('Veuillez spécifier une clé. Exemple: stend-config get apiBaseLink')
		main()
	}

	// Si on veut voir le chemin de la configuration
	else if(defaultArgs?.[0] == 'path') console.log(getConfigPath(true))

	// Sinon on affiche une interface
	else showTUI()

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

// Afficher un TUI pour demander les variables à éditer
async function showTUI(){
	// Importer les modules
	const inquirer = require('inquirer')

	// Demander les variables à éditer
	var answers = await inquirer.prompt([
		{
			type: 'list',
			name: 'key',
			message: 'Quelle est la variable à éditer ?',
			choices: [
				{
					name: '[apiBaseLink] Lien de base de l\'API',
					value: 'apiBaseLink'
				},
				{
					name: '[apiPassword] Mot de passe de l\'instance (si nécessaire pour l\'API)',
					value: 'apiPassword'
				},
				{
					name: '[webBaseLink] Lien de base du site (facultatif)',
					value: 'webBaseLink'
				}
			]
		},
		{
			type: 'input',
			name: 'value',
			message: 'Quelle est la nouvelle valeur ? Laissez vide pour afficher seulement, ou mettez "undefined" pour réinitialiser la valeur.'
		}
	])

	// Si on doit réinitialiser la valeur
	if(answers.value == 'undefined') answers.value = undefined

	// Adapter la valeur en fonction de la clé
	if(answers.value && (answers.key == 'apiBaseLink' || answers.key == 'webBaseLink')){
		if(answers.value && answers.value.endsWith('/')) answers.value = answers.value.substring(0, answers.value.length - 1)
		if(answers.value && !answers.value.startsWith('http') && (!answers.value.includes('localhost') || !answers.value.includes('127.0.0.1'))) answers.value = 'https://' + answers.value
	}

	// Définir les variables
	key = answers.key.trim()
	value = answers.value
	await main()
	console.log('(Vous pouvez utiliser CTRL+C pour quitter)\n')
	showTUI()
}

// Fonction principale
async function main(){
	// Modifier la variable
	const JSONdb = require('simple-json-db')
	const config = new JSONdb(getConfigPath(true))

	// Si on veut définir
	if(key && value){
		config.set(key, value)
		console.log('La variable a été définie avec succès !')
	}

	// Si on veut réinitialiser
	else if(key && value == undefined){
		config.delete(key)
		console.log('La variable a été réinitialisée avec succès !')
	}

	// Si on veut obtenir
	else if(key) console.log(config.get(key))

	// Retourner
	return
}