module.exports = {
	scripts_win32: {
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/windows/*",
		dest   : "<%= dir.releases %>/<%= package.name %>/win32/"
	},
	scripts_win64: {
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/windows/*",
		dest   : "<%= dir.releases %>/<%= package.name %>/win64/"
	},
	scripts_linux32: {
		options: { mode: 0o755 },
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/linux/*.sh",
		dest   : "<%= dir.releases %>/<%= package.name %>/linux32/"
	},
	scripts_linux64: {
		options: { mode: 0o755 },
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/linux/*.sh",
		dest   : "<%= dir.releases %>/<%= package.name %>/linux64/"
	},
	linuxarm64scripts: {
		options: { mode: 493 }, // 0755 (js strict mode)
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/linux/*.sh",
		dest   : "<%= dir.releases %>/<%= package.name %>/linuxarm64/"
	},

	icons_linux32: {
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/icons/*.png",
		dest   : "<%= dir.releases %>/<%= package.name %>/linux32/icons/"
	},
	icons_linux64: {
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/icons/*.png",
		dest   : "<%= dir.releases %>/<%= package.name %>/linux64/icons/"
	},
	linuxarm64icons: {
		expand : true,
		flatten: true,
		src    : "<%= dir.resources %>/icons/*.png",
		dest   : "<%= dir.releases %>/<%= package.name %>/linuxarm64/icons/"
	}
};
