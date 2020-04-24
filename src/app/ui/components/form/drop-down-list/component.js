import Component from "@ember/component";
import { get, set, setProperties, observer } from "@ember/object";
import { scheduleOnce } from "@ember/runloop";
import layout from "./template.hbs";


export default Component.extend({
	layout,

	tagName: "ul",
	classNames: [ "drop-down-list-component" ],
	classNameBindings: [
		"expanded:expanded",
		"upwards:expanded-upwards",
		"class"
	],

	expanded: false,
	upwards: false,


	willDestroyElement() {
		this._removeClickListener();
		this._super( ...arguments );
	},


	_expandedObserver: observer( "expanded", function() {
		// always remove click listener
		this._removeClickListener();

		if ( !get( this, "expanded" ) ) {
			return;
		}

		// DOM needs to update first before the element's size can be calculated
		scheduleOnce( "afterRender", () => this._calcExpansionDirection() );

		// register a click event listener on the document body that closes the drop-down-list
		this._clickListener = ({ target }) => {
			// ignore clicks on the DropDownComponent
			if ( !this.element.contains( target ) ) {
				setProperties( this, {
					expanded: false,
					upwards: false
				});
			}
		};
		this.element.ownerDocument.body.addEventListener( "click", this._clickListener );
	}),

	_removeClickListener() {
		// unregister click event listener
		if ( this._clickListener ) {
			this.element.ownerDocument.body.removeEventListener( "click", this._clickListener );
			this._clickListener = null;
		}
	},

	_calcExpansionDirection() {
		const element = this.element;
		const parent = element.parentElement;
		const parentHeight = parent.offsetParent.offsetHeight;
		const positionTop = parent.offsetTop;
		const { marginTop, marginBottom } = getComputedStyle( element );
		const listHeight = element.offsetHeight + parseInt( marginTop ) + parseInt( marginBottom );
		const isOverflowing = parentHeight - positionTop < listHeight;
		set( this, "upwards", isOverflowing );
	},


	actions: {
		change( item ) {
			if ( get( this, "disabled" ) ) { return; }
			setProperties( this, {
				expanded: false,
				selection: item
			});
		}
	}
});
