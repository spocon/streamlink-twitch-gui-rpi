import { computed } from "@ember/object";
import { alias, and } from "@ember/object/computed";
import { inject as service } from "@ember/service";
import { twitch } from "config";
import FormButtonComponent from "../form-button/component";
import TwitchInteractButtonMixin from "ui/components/-mixins/twitch-interact-button";


const { subscription: { "create-url": subscriptionCreateUrl } } = twitch;


export default FormButtonComponent.extend( TwitchInteractButtonMixin, {
	/** @type {I18nService} */
	i18n: service(),
	/** @type {NwjsService} */
	nwjs: service(),

	modelName: "twitchSubscription",

	// model alias (component attribute)
	model    : alias( "channel" ),
	// save the data on the channel record instead of the component
	record   : alias( "channel.subscribed" ),
	// use the channel's display_name
	name     : alias( "channel.display_name" ),

	isVisible: and( "isValid", "model.partner" ),

	classNameBindings: [ "_class" ],

	classLoading: "btn-primary",
	classSuccess: "btn-success",
	classFailure: "btn-primary",
	iconLoading : "fa-credit-card",
	iconSuccess : "fa-credit-card",
	iconFailure : "fa-credit-card",

	title: computed( "i18n.locale", "isLoading", "isSuccessful", "name", function() {
		if ( this.isLoading ) {
			return "";
		}

		const { name } = this;

		return this.isSuccessful
			? this.i18n.t( "components.subscribe-channel.title-renew", { name } ).toString()
			: this.i18n.t( "components.subscribe-channel.title-new", { name } ).toString();
	}),

	async action( success, failure ) {
		try {
			this.nwjs.openBrowser( subscriptionCreateUrl, {
				channel: this.model.name
			});
			await success();
		} catch ( err ) {
			await failure( err );
		}
	}
});
