document.addEventListener('DOMContentLoaded', function(done) {
	var req = ['text','search','url','tel','email','password','datetime','date','month','week','time','number','checkbox','file','textarea','select-one','select-multi'];
	var message = 'Select or fill in at least one option';
	// limited to elements that may be @required, excluding radio buttons / radioNodeList
	for(var j = 0; j < document.forms.length; j++){
		var form = document.forms[j];
		Object.defineProperty(form, 'ElementList', {
			// each form will show 'live' element groups listed by name
			get: function(){
				var list = {};
				for(var i = 0; i < this.elements.length; i++){
					var elm = this.elements[i];
					if(req.indexOf(elm.type) > -1){
						if(list[elm.name] === undefined){
							list[elm.name] = [];
						}
						list[elm.name].push(elm);
					}
				}
				return list;
			}
		});
		for(var i = 0; i < form.elements.length; i++){
			var elm = form.elements[i];
			var event = (elm.type == 'checkbox') ? 'click' : 'input';
			if(req.indexOf(elm.type) > -1){
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
						var elm = this.element;
						var group = elm.form.ElementList[elm.name];
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
					if(this.form.ElementList[this.name].length > 1){
						var first = this.form.ElementList[this.name][0];
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
					var group = this.form.ElementList[this.name];
					if(group.length > 1){
						if(this.validity.valueMissing){
							for(var z = 0; z < group.length; z++){
								if(!group[z].validity.customError) group[z].setCustomValidity(message);
							}
						} else {
							for(var z = 0; z < group.length; z++){
								if(group[z].validationMessage == message) group[z].setCustomValidity('');
							}
						}
					}
				});
				if(form.ElementList[elm.name].length > 1){
					if(elm.validity.valueMissing && !elm.validity.customError){
						// sets error from the beginning, unless the group has a value
						elm.setCustomValidity(message);
					}
				}
			}
		}
	}
});
