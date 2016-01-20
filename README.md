# AlternativeRequired
Allows browsers to validate alternative fields in a form, when at least one is required.

##Introduction
HTML5 allows authors to enable a native form validation. Easy use cases can be implemented without recurring to Javascript, while a good interface allows scripts to cover more difficult use cases easily.

However, there is a quite common use case that has no native covering. Consider the following cases:
1. a form requiring users to provide an email address or a phone number for further contact
2. a mailing list subscription where at least one argument of interest must be selected
3. a feedback form asking users to specify one or more issues in a service (with an free text alternative for unlisted options). 
In all these cases there are several controls, of which at least one has to be specified (selected/checked/filled in). Users can choose to specify more than one, or even all, but if all of them are empty the form should be invalid.

Although this can be achieved with some lines of code, if the web application complexity increases (e.g. form fields are added/modified, the interface is to be fully relied upon) everything becomes harder to obtain.

## My proposal
In short, I have suggested that all form controls allowing for a `required` attribute behave like **radio buttons**. In the case of radio button groups, the requiredness is satisfied when one of the controls sharing the same name is checked (of course there can be no more than one).
I think that all controls should allow this. When two or more controls have the same `name` and at least one of them is `required`, the requiredness is not satisfied **if and only if** all controls are empty/unchecked/unselected.

### The polyfill
This script is intended to be a polyfill for such use cases:
* When more controls have the same name, the error message specifies to choose the favourite alternative
* Like in radio button groups, `required` content attribute can be specified even on just one element in the group (however it remains a bad practice which makes the markup harder to read and maintain). IDL `required` attribute reflects the former, even if it is the group which is, in fact, required and not the elements
* IDL attributes `element.validity.valueMissing` and `element.validity.valid` are modified accordingly: the former is `true` only if all elements in a group (i.e. belonging to the same `form` and sharing the same `name`) are empty, the latter follows logically. CSS `:invalid` pseudo-class applies properly (it does not apply to a `required` element in a group when another one is specified)
* `<form>` elements have an `ElementList` property, grouping all relevant controls by name
* relevant controls not belonging to a `form` are listed in the `requiredAlternative.orphans` object, accessible individually in the `elements` property and grouped by name in the `ElementList` property.

## Installation and further use
* put the `script.js` file in the chosen directory
* insert the `<script type="text/javascript" src="`*`[path]`*`/script.js"></script>` tag in the form page, wherever you like. You don't need external libraries for it to work.
* use the same `name` attribute value on controls which allow the user to choose. *Remember, server-side script will have to deal with data sharing the same name!*
* in case of dynamically-updated pages, run `requiredAlternative.insertElement()` on newly-inserted elements. Run `requiredAlternative.insertForm()` on (guess what?!) new forms, if you insert one, instead.

### Known issues
- Dynamic pages must be manually updated as stated above (however I tried to make it simple :) )
- **IMPORTANT!** This script is primarily intended as a *polyfill* and it relies upon native validation, extending it to the case I had in mind. It does not replace native validation and it only works on browsers which support native validation, or coupled with libraries/plugins that faithfully reproduce native interface.
  - If anyone is interested, I could waste my time extending it to a full-fledged validation snippet. In due time everything can be done!

### Supported languages
English

> Based on the author's [suggestion](https://discourse.wicg.io/t/required-attribute-and-alternatives/1260) presented to Discourse WICG.
