/* Magic Mirror - WallberryTheme <3
 * Module: WB-calendat
 *
 * By Nicolas Cerveaux (@zzarbi)
 * MIT Licensed.
 */
Module.register("WB-calendar", {
	// Module config defaults.
	defaults: {
		initialLoadDelay: 60 * 1000,
		refreshInMinutes: 15,
		maximumNumberOfDays: 2,
		limitPerDay: 5,
		pastDaysCount: 0,
		template: "classic-wallberry",
		excludedEvents: [],
		calendars: [],
	},

	fetchTimer: null,
	calendarData: null,
	error: null,

	getTranslations() {
		return {
			en: "translations/en.json"
		};
	},

	getScripts() {
		return [
			"moment.js",
		];
	},

	getStyles() {
		console.log(this)
		return [
			this.file("css/" + this.config.template + ".css")
		];
	},

	getTemplate() {
		return `templates/${this.config.template}.njk`;
	},

	getTemplateData() {
		return {
			data: this.calendarData,
			config: this.config,
			now: new Date(),
			error: this.error
		};
	},

	start() {
		this.config.template = this.config.template.toLowerCase();
		Log.info(`Starting module: ${this.name}`)
		console.log(this.config);

		this.addNunjuckFilters();

		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	suspend() {
		Log.info(`Suspending module: ${this.name}`);
		clearTimeout(this.fetchTimer);
	},

	resume() {
		Log.info(`Resuming module: ${this.name}`);
		clearTimeout(this.fetchTimer);
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	scheduleUpdate(delay) {
		this.fetchTimer = setTimeout(() => {
			this.sendSocketNotification("FETCH_DATA", this.config);
			this.scheduleUpdate(this.config.refreshInMinutes * 60 * 1000);
		}, delay);
	},

	socketNotificationReceived (notification, payload) {
		switch(notification) {
			case "DATA_AVAILABLE":
				this.calendarData = payload.data;
				console.log(payload.data);
				this.updateDom();
				break;
		}
	},

	nunjucksEnvironment() {
		if (this._nunjucksEnvironment !== null) {
			return this._nunjucksEnvironment;
		}

		this._nunjucksEnvironment = new nunjucks.Environment(new nunjucks.WebLoader(this.file(""), {async: true, useCache: true}), {
			trimBlocks: true,
			lstripBlocks: true
		});

		return this._nunjucksEnvironment;
	},

	addNunjuckFilters() {
		this.nunjucksEnvironment().addFilter("dateFmt", function(date, format) {
			var result;
			var errs = [];
			var obj;
			try {
				obj = moment(date);
				result = obj.format(format);
			} catch (err) {
				errs.push(err);
			}
		
			if (errs.length) {
				return errs.join("\n");
			}
			return result;
		});

		this.nunjucksEnvironment().addFilter("precipIcons", function(precipType) {
			return this.precipitationTypes[precipType];
		}.bind(this));

		this.nunjucksEnvironment().addFilter("translate", function(str, variables) {
			return this.translate(str, variables);
		}.bind(this));
	},
});
