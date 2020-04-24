import { HTML as decodeHTML } from "entities/lib/decode";


const { isArray } = Array;


/**
 * @typedef {Object} NotificationDataMessageList
 * @property {string} title
 * @property {string} message
 */


/**
 * @class NotificationData
 * @property {string} title
 * @property {(string|NotificationDataMessageList[])} message
 * @property {string} icon
 * @property {Function} click
 * @property {(*)?} settings
 */
export default class NotificationData {
	constructor({ title, message, icon, click, settings }) {
		this.title = title;
		this.message = this.decodeMessage( message );
		this.icon = icon;
		this.click = click;
		this.settings = settings;
	}

	/**
	 * @param {(string|NotificationDataMessageList[])} message
	 * @returns {(string|NotificationDataMessageList[])}
	 */
	decodeMessage( message ) {
		return isArray( message )
			? message.map( ({ title, message }) => ({
				title,
				message: decodeHTML( message )
			}) )
			: decodeHTML( message );
	}

	/**
	 * @returns {string}
	 */
	getMessageAsString() {
		return isArray( this.message )
			? this.message.map( message => message.title ).join( ", " )
			: this.message;
	}

	/**
	 * @returns {string}
	 */
	getIconAsFileURI() {
		return `file://${this.icon}`;
	}
}
