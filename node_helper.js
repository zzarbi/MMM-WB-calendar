const NodeHelper = require("node_helper");
const ical = require('node-ical');

module.exports = NodeHelper.create({

	async fetchData(config) {

		const today = new Date((new Date()).getTime() - (30*60*1000));
		const result = {
			calendars: [],
			events: [],
		}
		for (key in config.calendars) {
			const cal = config.calendars[key];
			const events = await ical.async.fromURL(cal.url);

			// setting up legends
			result.calendars.push({
				name: cal.name,
				color: cal.color,
			})
			
			for (const event of Object.values(events)) { // todo check repeat
				if (event.transparency !== 'TRANSPARENT' && event.type == 'VEVENT'
				&& event.start >= today) {
					result.events.push({
						start: event.start,
						end: event.end,
						title: event.summary,
						allDay: !(event.datetype === 'date-time'),
						color: cal.color,

					});
				}
			};
		}

		if (result.events.length > 0) {
			result.events.sort((a,b) => {
				if ( a.start < b.start) {
					return -1;
				}
				if ( a.start > b.start ) {
					return 1;
				}
				return 0;
			});
		}
		this.sendSocketNotification("DATA_AVAILABLE", {data: result});
	},

	socketNotificationReceived(notification, payload) {
		switch(notification) {
			case "FETCH_DATA":
				this.fetchData(payload);
			break;
		}
	}
});
