'use strict';
var requiredAlternative = {
	req: ['text','search','url','tel','email','password','datetime','date','month','week','time','number','checkbox','file','textarea','select-one','select-multi'],
	// limited to elements that may be @required, excluding radio buttons / radioNodeList
	message: 'Select or fill in at least one option',
	action: function(elm, init){
		var form = (elm.form === null) ? orphans : elm.form;
		var group = form.ElementList[elm.name];
		if(group.length > 1){
			if(elm.validity.valueMissing){
				for(var z = 0; z < group.length; z++){
					if(!group[z].validity.customError) group[z].setCustomValidity(requiredAlternative.message);
				}
			} else if(!init){
				for(var z = 0; z < group.length; z++){
					if(group[z].validationMessage == requiredAlternative.message) group[z].setCustomValidity('');
				}
			}
		}
		return elm.validity.valueMissing;
	},
	orphans: {
		// this is for elements out of forms
		add: function(search, stack){
			for(var i = 0; i < search.children.length; i++){
				var elm = search.children[i];
				var type = elm.type;
				if(requiredAlternative.req.indexOf(type) > -1){
					if(elm.form === null){
						stack.push(elm);
					}
					var event = (type == 'checkbox' || type == 'select-one' || type == 'select-multi') ? 'change' : 'input'; // input sometimes is not fired / too fast
					// prevents native tooltips on IE and FF while correctly reporting requiredness
					elm.dataRequired = elm.required;
					elm.required = false;
					Object.defineProperty(elm, 'required', {
						set: function(val){
							this.dataRequired = val;
						},
						get: function(){
							return this.dataRequired;
						}
					});
					Object.defineProperty(elm, 'validity', {
						// prevents UAs from reassigning 'validity' on Invalid event
						value: {}
					});
					elm.validity['element'] = elm; // workaround not to define validity object from scratch
					Object.defineProperty(elm.validity, 'valueMissing', {
						// value will be missing if all elements in the group are empty/unchecked and any element is required - extends native
						get: function(){
							var filled = false;
							var required = false;
							var form = (this.element.form === null) ? orphans : this.element.form;
							var group = form.ElementList[this.element.name];
							for(var y = 0; y < group.length; y++){
								filled = ((group[y].type == 'checkbox') ? group[y].checked : Boolean(group[y].value)) ? true : filled;
								required = (group[y].required) ? true : required;
							}
							return (!filled && required);
						}
					});
					Object.defineProperty(elm.validity, 'valid', {
						// validity according to new valueMissing
						get: function(){
							return !(this.badInput || this.customError || this.patternMismatch || this.rangeOverflow || this.rangeUnderflow || this.stepMismatch || this.tooLong || this.tooShort || this.typeMismatch || this.valueMissing);
						}
					});
					elm.addEventListener('invalid', function(invalid){
						var form = (this.form === null) ? orphans : this.form;
						if(form.ElementList[this.name].length > 1){
							var first = form.ElementList[this.name][0];
							var nativeValueMissing = ((this.type == 'checkbox' && !this.checked) || (this.type != 'checkbox' && !this.value) && this.required);
							if(nativeValueMissing != this.validity.valueMissing){
								// if a value is defined or a checkbox checked in the group, do nothing
								invalid.preventDefault();
							}
						}
					});
					elm.addEventListener(event, function(ev){
						// custom error for elements in lists with more than 1 element
						// gives precedence to other custom errors
						requiredAlternative.action(this, false)
					});
				} else {
					this.add(elm, stack);
				}
			}
		},
		get elements(){
			var stack = [];
			this.add(document.body, stack);
			return stack;
		}
	},
	init: function(){
	 	for(var j = -1; j < document.forms.length; j++){
			var form = (j == -1) ? requiredAlternative.orphans : document.forms[j];
			// first call is to requiredAlternative.orphans
			// also overwrites properties and adds event listeners
			if(form.ElementList !== undefined){
				delete form.ElementList;
			}
			Object.defineProperty(form, 'ElementList', {
				// each form will show 'live' element groups listed by name
				configurable: true,
				get: function(){
					var list = {};
					for(var i = 0; i < this.elements.length; i++){
						var elm = this.elements[i];
						if(requiredAlternative.req.indexOf(elm.type) > -1){
							if(list[elm.name] === undefined){
								list[elm.name] = [];
							}
							list[elm.name].push(elm);
						}
					}
					return list;
				}
			});
			for(var groupName in form.ElementList){
				// initialisation error messages
				requiredAlternative.action(form.ElementList[groupName][0], true);
			}
		}
	}
}
document.addEventListener('DOMContentLoaded', function(done) {
	requiredAlternative.init();
});
