module.exports = {
	win32: {
		before: [ "clean:release_win32" ],
		after : [ "copy:scripts_win32" ]
	},
	win64: {
		before: [ "clean:release_win64" ],
		after : [ "copy:scripts_win64" ]
	},
	osx64: {
		before: [ "clean:release_osx64" ],
		after: [ "shell:permissions_osx64" ]
	},
	linux32: {
		before: [ "clean:release_linux32" ],
		after : [
			"copy:scripts_linux32",
			"copy:icons_linux32",
			"shell:permissions_linux32"
		]
	},
	linux64: {
		before: [ "clean:release_linux64" ],
		after : [
			"copy:scripts_linux64",
			"copy:icons_linux64",
			"shell:permissions_linux64"
		]
	},
	linuxarm64: {
		before: [ "clean:release_linuxarm64" ],
		after : [
			"copy:linuxarm64scripts",
			"copy:linuxarm64icons",
			"shell:permissions_linuxarm64"
		]
	}
};
