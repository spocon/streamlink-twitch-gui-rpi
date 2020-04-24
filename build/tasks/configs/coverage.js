module.exports = {
	"reporters": [
		{
			"name": "html",
			"options": {
				"subdir": "html-report",
				"skipEmpty": false
			}
		},
		{
			"name": "json",
			"options": {
				"file": "coverage.json"
			}
		}
	],
	"watermarks": {
		"lines": [ 80, 95 ],
		"functions": [ 80, 95 ],
		"branches": [ 80, 95 ],
		"statements": [ 80, 95 ]
	},
	"i18n": {
		"exclude": [
			"hotkeys.codes.*"
		]
	}
};
