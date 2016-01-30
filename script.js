'use strict';
var requiredAlternative = {
	req: ['fieldset','text','search','url','tel','email','password','datetime','date','month','week','time','number','checkbox','file','textarea','select-one','select-multi'],
	// limited to elements that may be @required, excluding radio buttons / radioNodeList
	message: function(){
		var msgs = {
			'en': ["All the", "At least ", " field", " fields", " of this section ", "is required", "are required"],
			'fr': ["Toutes les", "Au moins ", " zone", " zones", " de cette section ", "doit être renseignée", "doivent être renseignées"],
			'it': ["Tutti i", "Almeno ", " campo", " campi", " di questa sezione ", "è obbligatorio", "sono obbligatori"]
		}
		var testlang = [navigator.language || navigator.userLanguage, document.documentElement.lang];
		var msg;
		var i = 0; 
		while(!msg && testlang[i]){
			msg = (testlang[i]) ? msgs[testlang[i].split('-')[0].toLowerCase()] || false : false;
			i++;
		}
		return msg || msgs['en'];
	},
	setMsg: function(required,length){
		var msg;
		if(required == length){
			msg = this.msg[0] + this.msg[3] + this.msg[4] + this.msg[6];
		} else {
			var k = (required > 1);
			msg = this.msg[1] + required + this.msg[2 + k] + this.msg[4] + this.msg[5 + k];
		}
		return msg;
	},
	cycle: function(callback1,callback2,haystack,storeVar){
		var list = haystack.querySelectorAll('fieldset, input, textarea, select, keygen, output, button');
		// element.validity will be fixed on all elements supporting it. They call it consistency.
		var result = 0;
		var elm;
		for(var i = 0; i < list.length; i++){
			elm = list[i];
			if(requiredAlternative.req.indexOf(elm.type) > -1){
				result += this[callback1](elm);
				if(storeVar !== undefined){
					storeVar.push(elm);
				}
			} else if(callback2){
				this[callback2](elm);
			}
		}
		return result;
	},
	check: function(elm){
		return (elm.type == 'checkbox') ? elm.checked : Boolean(elm.value);
	},
	getGroup: function(node){
		var result = false;
		var stack = [];
		var fieldset = false;
		do{
			if(node.tagName == 'FIELDSET'){
				fieldset = node;
				break;
			}
			node = node.parentElement;
		} while(node.tagName != 'FORM' && node.tagName != 'BODY');
		if(fieldset){
			var required = fieldset.dataset.required || fieldset.getAttribute('required') || null;
			if(required !== null){
				var filled = this.cycle('check',false,fieldset,stack)
				required = (required == '' || isNaN(required)) ? stack.length : Math.min(stack.length, parseInt(required));
				result = {'required': required, 'filled': filled, 'stack': stack}
			}
		}
		return result;
	},
	action: function(elm,added){
		var init = (elm.tagName == 'FIELDSET');
		var result = this.getGroup(elm);
		if(result){
			var newMsg = this.setMsg(result.required,result.stack.length);
			var oldMsg = (added) ? this.setMsg(result.required, result.stack.length - 1) : newMsg;
			if(result.filled < result.required){
				for(var z = 0; z < result.stack.length; z++){
					// sets groupMissing error. Also removes it from controls which have been filled in
					if(!result.stack[z].validity.customError || result.stack[z].validationMessage == oldMsg){
						result.stack[z].setCustomValidity(this.check(result.stack[z]) ? '' : newMsg);
					}
				}
			} else if(!init){
				// this loop will not be done on error messages initialisation
				for(var z = 0; z < result.stack.length; z++){
					if(result.stack[z].validationMessage == oldMsg){
						result.stack[z].setCustomValidity('');
					}
				}
			}
		}
	},
	setEvent: function(elm){
		var type = elm.type;
		elm.addEventListener('change', function(ev){
			requiredAlternative.action(this);
		});
	},
	setProperty: function(elm,simple){
		var n = 'groupMissing'
		Object.defineProperty(elm, 'validity', {
			// prevents UAs from reassigning 'validity' on Invalid event
			value: {}
		});
		if(simple){
			Object.defineProperty(elm.validity, n, {
				// this is just for consistency (!)
				enumerable: true,
				writable: true,
				value: false
			});
		} else {
			Object.defineProperty(elm.validity, 'element', {
				// workaround not to define Validity object from scratch
				value: elm
			});
			Object.defineProperty(elm.validity, n, {
				// value will be missing if all elements in the group are empty/unchecked and fieldset.required is truthy
				enumerable: true,
				get: function(){
					var result = requiredAlternative.getGroup(this.element);
					return (result) ? (result.filled < result.required) : false;
				}
			});
		}
		Object.defineProperty(elm.validity, 'valid', {
			// validity according to new groupMissing
			get: function(){
				var result = true;
				for(var prop in this){
					if(this[prop] && prop != 'valid'){
						result = false;
						break;
					}
				}
				return result;
			}
		});
	},
	setElement: function(elm){
		this.setEvent(elm);
		this.setProperty(elm);
	},
	defaultProperty: function(elm){
		this.setProperty(elm, true);
	},
	setFieldset: function(fieldset){
		Object.defineProperty(fieldset, 'required', {
			// required in fieldset returns the minimum number of required fields
			get: function(){
				var result = requiredAlternative.getGroup(fieldset);
				return (result) ? {'number': result.required, 'elements': result.stack} : false;
			}
		});
		this.action(fieldset);
	},
	initFieldsets: function(haystack){
		var list = haystack.getElementsByTagName('FIELDSET');
		for(var i = 0; i < list.length; i++){
			this.setFieldset(list[i]);
		}
	},
	init: function(haystack){
		if(haystack === undefined){
			haystack = document.body;
			this.msg = requiredAlternative.message();
		}
		this.cycle('setElement','defaultProperty',haystack);
		this.initFieldsets(haystack);
	},
	/* These methods are to be invoked in case a new control or a new form are inserted into the document */
	insertElement: function(elm){
		// if an element has been added, the message to match is computed differently
		this.setElement(elm);
		this.action(elm,true);
	},
	insertForm: function(form){
		this.init(form);
	}
}
document.addEventListener('DOMContentLoaded', function(done) {
	requiredAlternative.init();
});
