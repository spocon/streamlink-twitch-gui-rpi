import { module, test } from "qunit";
import { buildOwner, runDestroy } from "test-utils";
import { FakeI18nService } from "i18n-utils";
import { set } from "@ember/object";
import Service from "@ember/service";
import sinon from "sinon";

import notificationServiceDispatchMixinInjector
	from "inject-loader?./icons&./logger&./provider&nwjs/Window!services/notification/dispatch";
import {
	ATTR_NOTIFY_CLICK_NOOP,
	ATTR_NOTIFY_CLICK_FOLLOWED,
	ATTR_NOTIFY_CLICK_STREAM,
	ATTR_NOTIFY_CLICK_STREAMANDCHAT
} from "data/models/settings/notification/fragment";


module( "services/notification/dispatch", {
	beforeEach() {
		this.owner = buildOwner();

		this.iconDownloadStub = sinon.stub();
		this.logDebugSpy = sinon.spy();
		this.showNotificationStub = sinon.stub();
		this.setMinimizedSpy = sinon.spy();
		this.setVisibilitySpy = sinon.spy();
		this.setFocusedSpy = sinon.spy();
		this.transitionToSpy = sinon.spy();
		this.openChatStub = sinon.stub();
		this.startStreamStub = sinon.stub();

		const { default: subject } = notificationServiceDispatchMixinInjector({
			"./icons": {
				iconGroup: "group-icon-path",
				iconDownload: this.iconDownloadStub
			},
			"./logger": {
				logDebug: this.logDebugSpy
			},
			"./provider": {
				showNotification: this.showNotificationStub
			},
			"nwjs/Window": {
				setMinimized: this.setMinimizedSpy,
				setVisibility: this.setVisibilitySpy,
				setFocused: this.setFocusedSpy
			}
		});

		this.owner.register( "service:notification", Service.extend( subject ) );
		this.owner.register( "service:chat", Service.extend({
			openChat: this.openChatStub
		}) );
		this.owner.register( "service:i18n", FakeI18nService );
		this.owner.register( "service:router", Service.extend({
			transitionTo: this.transitionToSpy
		}) );
		this.owner.register( "service:settings", Service.extend({
			notification: {},
			streams: {}
		}) );
		this.owner.register( "service:streaming", Service.extend({
			startStream: this.startStreamStub
		}) );

		this.subject = this.owner.lookup( "service:notification" );
	},

	afterEach() {
		runDestroy( this.owner );
	}
});


test( "dispatchNotifications", async function( assert ) {

	/** @type Sinon.SinonStub icon */
	const iconStub = this.iconDownloadStub;
	const groupStub = sinon.stub();
	const singleStub = sinon.stub();
	const showSpy = sinon.spy();

	function reset() {
		singleStub.reset();
		groupStub.reset();
		iconStub.reset();
		showSpy.resetHistory();
	}

	this.subject.reopen({
		_getNotificationDataGroup: groupStub,
		_getNotificationDataSingle: singleStub,
		_showNotification: showSpy
	});

	const streamA = { foo: 1 };
	const streamB = { bar: 2 };

	// don't do anything on missing streams
	await this.subject.dispatchNotifications();
	assert.notOk( singleStub.called, "Does not create single notification" );
	assert.notOk( groupStub.called, "Does not create group notification" );
	assert.notOk( iconStub.called, "Does not download icons" );
	assert.notOk( showSpy.called, "Does not show notifications" );

	// don't do anything on empty streams
	await this.subject.dispatchNotifications( [] );
	assert.notOk( singleStub.called, "Does not create single notification" );
	assert.notOk( groupStub.called, "Does not create group notification" );
	assert.notOk( iconStub.called, "Does not download icons" );
	assert.notOk( showSpy.called, "Does not show notifications" );

	// enable grouping
	set( this.subject, "settings.notification.grouping", true );

	// show single notification on a single stream if grouping is enabled
	singleStub.returns({ one: 1 });
	await this.subject.dispatchNotifications([ streamA ]);
	assert.notOk( groupStub.called, "Does not create group notification" );
	assert.propEqual( iconStub.args, [ [ streamA ] ], "Downloads icon" );
	assert.propEqual( singleStub.args, [ [ streamA ] ], "Creates single notification" );
	assert.ok( iconStub.calledBefore( singleStub ), "Downloads icon first" );
	assert.propEqual( showSpy.lastCall.args, [{ one: 1 }], "Shows notification" );
	reset();

	// show a group notification on multiple streams if grouping is enabled
	groupStub.returns({ two: 2 });
	await this.subject.dispatchNotifications([ streamA, streamB ]);
	assert.notOk( singleStub.called, "Does not show single notification" );
	assert.propEqual(
		groupStub.lastCall.args,
		[ [ streamA, streamB ] ],
		"Shows group notification"
	);
	assert.notOk( iconStub.called, "Does not download icons" );
	assert.propEqual( showSpy.lastCall.args, [{ two: 2 }], "Shows notification" );
	reset();

	// disable grouping
	set( this.subject, "settings.notification.grouping", false );

	// show multiple single notifications if grouping is disabled
	singleStub.onFirstCall().returns({ three: 3 });
	singleStub.onSecondCall().returns({ four: 4 });
	await this.subject.dispatchNotifications([ streamA, streamB ]);
	assert.notOk( groupStub.called, "Does not create group notification" );
	assert.propEqual( iconStub.args, [ [ streamA ], [ streamB ] ], "Downloads icons" );
	assert.propEqual(
		singleStub.args,
		[ [ streamA ], [ streamB ] ],
		"Creates single notifications"
	);
	assert.ok( iconStub.firstCall.calledBefore( singleStub.firstCall ), "Downloads icons first" );
	assert.ok( iconStub.lastCall.calledBefore( singleStub.lastCall ), "Downloads icons first" );
	assert.propEqual( showSpy.args, [ [{ three: 3 }], [{ four: 4 }] ], "Shows both notification" );
	reset();

	// fail icon download
	iconStub.onFirstCall().rejects( new Error( "fail" ) );
	iconStub.onSecondCall().resolves();
	singleStub.withArgs( streamA ).returns({ five: 5 });
	singleStub.withArgs( streamB ).returns({ six: 6 });
	await assert.rejects(
		this.subject.dispatchNotifications([ streamA, streamB ]),
		new Error( "fail" ),
		"Rejects on download error, but tries to show all notifications"
	);
	assert.notOk( groupStub.called, "Does not create group notification" );
	assert.propEqual( iconStub.args, [ [ streamA ], [ streamB ] ], "Downloads all icons" );
	assert.propEqual( singleStub.args, [ [ streamB ] ], "Creates second single notification" );
	assert.propEqual( showSpy.args, [ [{ six: 6 }] ], "Shows second notification" );

});


test( "Group and single notification data", function( assert ) {

	/** @type {NotificationData} notification */
	let notification;

	const streamA = {
		channel: {
			display_name: "foo",
			status: "123"
		},
		logo: "logo"
	};
	const streamB = {
		channel: {
			display_name: "bar"
		}
	};

	const clickSpy = sinon.spy();

	this.subject.reopen({
		_notificationClick: clickSpy
	});

	// show group notification
	set( this.subject, "settings.notification.click_group", 1 );
	notification = this.subject._getNotificationDataGroup([ streamA, streamB ]);
	notification.click();
	assert.propEqual( notification, {
		title: "services.notification.dispatch.group",
		message: [{
			title: "foo",
			message: "123"
		}, {
			title: "bar",
			message: ""
		}],
		icon: "group-icon-path",
		click: () => {},
		settings: 1
	}, "Returns correct group notification data" );
	assert.propEqual( clickSpy.args, [ [ [ streamA, streamB ], 1 ] ], "Group click callback" );
	clickSpy.resetHistory();

	// show single notification with logo
	set( this.subject, "settings.notification.click", 2 );
	notification = this.subject._getNotificationDataSingle( streamA );
	notification.click();
	assert.propEqual( notification, {
		title: "services.notification.dispatch.single{\"name\":\"foo\"}",
		message: "123",
		icon: "logo",
		click: () => {},
		settings: 2
	}, "Returns correct single notification data" );
	assert.propEqual( clickSpy.args, [ [ [ streamA ], 2 ] ], "Single click callback" );
	clickSpy.resetHistory();

	// show single notification without logo
	set( this.subject, "settings.notification.click", 3 );
	notification = this.subject._getNotificationDataSingle( streamB );
	notification.click();
	assert.propEqual( notification, {
		title: "services.notification.dispatch.single{\"name\":\"bar\"}",
		message: "",
		icon: "group-icon-path",
		click: () => {},
		settings: 3
	}, "Returns correct single notification data with group icon" );
	assert.propEqual( clickSpy.args, [ [ [ streamB ], 3 ] ], "Single click callback" );

});


test( "Notification click", async function( assert ) {

	this.startStreamStub.rejects();
	this.openChatStub.rejects();

	const reset = () => {
		this.logDebugSpy.resetHistory();
		this.transitionToSpy.resetHistory();
		this.setMinimizedSpy.resetHistory();
		this.setVisibilitySpy.resetHistory();
		this.setFocusedSpy.resetHistory();
		this.startStreamStub.resetHistory();
		this.openChatStub.resetHistory();
	};

	class Channel {
		constructor( settings ) {
			this.settings = settings;
		}
		async getChannelSettings() {
			return this.settings;
		}
	}

	const cA = new Channel({ streams_chat_open: null });
	const cB = new Channel({ streams_chat_open: false });
	const cC = new Channel({ streams_chat_open: true });
	const sA = { channel: cA };
	const sB = { channel: cB };
	const sC = { channel: cC };

	// noop
	await this.subject._notificationClick( [ sA, sB ], ATTR_NOTIFY_CLICK_NOOP );
	assert.notOk( this.logDebugSpy.called, "Doesn't do anything" );
	reset();

	// restore GUI (only test ATTR_NOTIFY_CLICK_FOLLOWED)
	set( this.subject, "settings.notification.click_restore", true );

	// transitionTo with restore option
	await this.subject._notificationClick( [ sA, sB ], ATTR_NOTIFY_CLICK_FOLLOWED );
	assert.ok( this.logDebugSpy.called, "Logs click" );
	assert.propEqual( this.transitionToSpy.args, [ [ "user.followedStreams" ] ], "Shows followed" );
	assert.propEqual( this.setMinimizedSpy.args, [ [ false ] ], "Restore" );
	assert.ok( this.setMinimizedSpy.calledBefore( this.transitionToSpy ), "Restore first" );
	assert.propEqual( this.setVisibilitySpy.args, [ [ true ] ], "Unhide" );
	assert.ok( this.setVisibilitySpy.calledBefore( this.transitionToSpy ), "Unhide first" );
	assert.propEqual( this.setFocusedSpy.args, [ [ true ] ], "Focus" );
	assert.ok( this.setFocusedSpy.calledBefore( this.transitionToSpy ), "Focus first" );
	reset();

	// disable restore option for now
	set( this.subject, "settings.notification.click_restore", false );

	// transitionTo
	await this.subject._notificationClick( [ sA, sB ], ATTR_NOTIFY_CLICK_FOLLOWED );
	assert.ok( this.logDebugSpy.called, "Logs click" );
	assert.notOk( this.setMinimizedSpy.called, "Does not restore" );
	assert.notOk( this.setVisibilitySpy.called, "Does not unhide" );
	assert.notOk( this.setFocusedSpy.called, "Does not focus" );
	assert.propEqual( this.transitionToSpy.args, [ [ "user.followedStreams" ] ], "Shows followed" );
	reset();

	// launch streams and always resolve
	await this.subject._notificationClick( [ sA, sB, sC ], ATTR_NOTIFY_CLICK_STREAM );
	assert.ok( this.logDebugSpy.called, "Logs click" );
	assert.propEqual( this.startStreamStub.args, [ [ sA ], [ sB ], [ sC ] ], "Launches streams" );
	reset();

	// launch streams+chats and always resolve (global open_chat is false)
	set( this.subject, "settings.streams.chat_open", false );
	await this.subject._notificationClick( [ sA, sB, sC ], ATTR_NOTIFY_CLICK_STREAMANDCHAT );
	assert.ok( this.logDebugSpy.called, "Logs click" );
	assert.propEqual( this.startStreamStub.args, [ [ sA ], [ sB ], [ sC ] ], "Launches streams" );
	assert.propEqual( this.openChatStub.args, [ [ cA ], [ cB ] ], "Opens chats A and B" );
	reset();

	// launch streams+chats and always resolve (global open_chat is true)
	set( this.subject, "settings.streams.chat_open", true );
	await this.subject._notificationClick( [ sA, sB, sC ], ATTR_NOTIFY_CLICK_STREAMANDCHAT );
	assert.ok( this.logDebugSpy.called, "Logs click" );
	assert.propEqual( this.startStreamStub.args, [ [ sA ], [ sB ], [ sC ] ], "Launches streams" );
	assert.propEqual( this.openChatStub.args, [ [ cB ] ], "Opens chat B" );

});


test( "Show notficiation", async function( assert ) {

	const settings = this.owner.lookup( "service:settings" );
	set( settings, "notification.provider", "provider" );

	const notification = { foo: 1 };

	// resolve
	this.showNotificationStub.resolves();
	await this.subject._showNotification( notification );
	assert.propEqual(
		this.showNotificationStub.args,
		[ [ "provider", notification, false ] ],
		"Shows notification"
	);
	this.showNotificationStub.reset();

	// reject
	this.showNotificationStub.rejects();
	await this.subject._showNotification( notification );
	assert.ok( this.showNotificationStub.called, "Doesn't reject when showNotification rejects" );
	this.showNotificationStub.reset();

	// reject later
	let reject;
	const promise = new Promise( ( _, r ) => reject = r );
	this.showNotificationStub.returns( promise );
	await this.subject._showNotification( notification );
	reject();
	assert.ok( this.showNotificationStub.called, "Doesn't reject when showNotification rejects" );

});
