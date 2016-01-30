# AlternativeRequired 2.0
Allows browsers to validate alternative fields in a form, when at least one is required.

##Introduction
HTML5 allows authors to enable a native form validation. Easy use cases can be implemented without recurring to Javascript, while a good interface allows scripts to cover more difficult use cases easily.

However, there is a quite common use case that has no native covering. Consider the following cases:

1. a form requiring users to provide an email address or a phone number for further contact
2. a mailing list subscription where at least one argument of interest must be selected
3. a feedback form asking users to specify one or more issues in a service (with an free text alternative for unlisted options). 

In all these cases there are several controls, of which at least one has to be specified (selected/checked/filled in). Users can choose to specify more than one, or even all, but if all of them are empty the form should be invalid.

Although this can be achieved with some lines of code, if the web application complexity increases (e.g. form fields are added/modified, the interface is to be fully relied upon) everything becomes harder to obtain.

In addition to this, custom error API is quite poor in HTML5. It does not easily allow scripts to distinguish between different custom errors, and in order to enable something similar to native errors, the script complexity increases exponentially, also because validation is one of the most **live** features of HTML.

## Installation and further use
* put the `script.js` file in the chosen directory
* insert the `<script type="text/javascript" src="`*`[path]`*`/script.js"></script>` tag in the form page, wherever you like. You don't need external libraries for it to work.
* Group the forms which can be chosen alternatively inside the same `<fieldset>` element.
* Specify `required` attribute on the fieldset. Use `<fieldset required="x">` syntax to state that at least `x` elements must have a selected option, or checked, or filled in (don't worry if you specify `<fieldset required="42">` while the fieldset only has 4 relevant controls: it will simply mean the same as below).
  * use `<fieldset required="required">` to state that *all* the controls are required.
  * Oh, you don't like using invalid syntax? Good ol' Andy agrees: use `<fieldset data-required="x">`, it will do the same.
* in case of dynamically-updated pages, run `requiredAlternative.insertElement()` on newly-inserted elements. Run `requiredAlternative.insertForm()` on (guess what?!) new forms, if you insert one, instead.
  * `test` folder provides a very basic example of how it works.

### Known issues
- Dynamic pages must be manually updated as stated above (however I tried to make it simple :) )
- **IMPORTANT!** This script is primarily intended as a *polyfill* (see below) and it extends native validation to the case I had in mind. It does not replace native validation and it only works on browsers which support native validation (it could work unexpectedly if coupled with libraries/plugins that faithfully reproduce native interface, because it redefines `element.validity` object, so test it before using it in production sites).
  - If anyone is interested, I could wast... er, spend my time extending it to a full-fledged validation snippet. In due time everything can be done!
- This script also relies upon up-to-date JS features, so it could not work as expected on legacy UAs.
  - Again, as stated above, if necessary it can be extended.

### Supported languages
English, French (Français), Italian (Italiano)

## My NEW proposal
The scenario described in the introduction could be achieved by allowing authors to specify `required` attribute on `fieldset` elements. The semantics for this case could be different from `required` attribute on form controls: it could take an integer value to indicate how many form controls inside it must be specified in order for the form to be valid. It should also accept non-numeric values (e.g. `required=""`, `required=required`, `required=foo`), meaning that ALL the controls in the fieldset are required.

`ValidityState` object would reflect this situation, with a brand-new error (I called it `groupMissing`). It returns `false` if:
* the element is not associated with a form
* the element is not a descendant of a fieldset
* the fieldset ancestor of the element has an IDL attribute returning `false` (i.e. either it has no `required` content attribute, or the author has decided to specify `fieldset required=0`)
* of all the relevant controls inside a fieldset element where `fieldset.required.number = x`, at least `x`are specified 
  * the definition *relevant controls* groups all the form controls on which the attribute `required` can be specified
  * a *specified control* is a checked checkbox, or a select with at least a selected option, or any other input with a non-null value 

From the count of required fields a number of controls should be excluded:
* `<input type="color" />` and `<input type="range" />` are never counted, either as required or as filled in, because they're basically always filled in (they always have a default value).
* `<input type="radio" />` and `RadioNodeList`s are excluded for a similar reason. Once a radio is checked, its radio list has a value and cannot be reset (for this reason, a blank form with an unchecked radio node list is considered really poor form)
* form elements out of user control (`meter`, `progress`, `keygen`, `button`) are usually changed indirectly, they rely upon scripts in order to work, and as such it makes no sense that they are `required` either directly or indirectly. 

### The polyfill
This script is intended to be a polyfill for such use cases:
* When more controls are in the same fieldset, an error message asks users to specify at least a certain number of alternatives, leaving the users themselves choose which one(s) they prefer.
* `required` content attribute on controls does not interfere with `fieldset@required`. This way there can still be required controls which must be specified, along with free choice.
* IDL `fieldset.required` attribute returns `false` if the fieldset hasn't such requisite; otherwise it returns an object with two properties:
  * `number`: the minimum number of elements which has to be filled in;
  * `elements`: the list of elements taken into account for validation (namely `select` elements, `textarea` elements and a subset of `input` elements).
* `element.validity.groupMissing` will tell you if there is an insufficient number of filled in elements. `element.validity.valid` is fixed accordingly.

> Based on the author's [suggestion](https://discourse.wicg.io/t/required-attribute-and-alternatives/1260) presented to Discourse WICG.
