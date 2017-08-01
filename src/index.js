/*
	Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
	Licensed under the Amazon Software License (the "License"). You may not use this file except
	in compliance with the License. A copy of the License is located at
		http://aws.amazon.com/asl/
	or in the "LICENSE.txt" file accompanying this file.
	This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
	express or implied. See the License for the specific language governing permissions and
	limitations under the License.
*/
/*
 * This code sample demonstrates an implementation of the Lex Code Hook Interface
 * in order to serve a bot which is used to order coffee.
 *
 * For instructions on how to set up and test this bot, as well as additional samples,
 *  visit the Lex Getting Started documentation.
 *
 * This example is intentionally simplistic for illustration; please consider using
 * the Amazon Lex blueprints for your projects.
 */
'use strict';
const todayMenuBeverageType = {
        'mocha':{'size': ['short', 'small', 'medium', 'large']}, 
        'chai':{'size': ['small', 'short']}
};

// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ElicitSlot',
			intentName,
			slots,
			slotToElicit,
			message,
			responseCard,
		},
	};
}

function confirmIntent(sessionAttributes, intentName, slots, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ConfirmIntent',
			intentName,
			slots,
			message,
			responseCard,
		},
	};
}

function close(sessionAttributes, fulfillmentState, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Close',
			fulfillmentState,
			message,
			responseCard,
		},
	};
}

function delegate(sessionAttributes, slots) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Delegate',
			slots,
		},
	};
}



// ---------------- Helper Functions --------------------------------------------------

// build a message for Lex responses
function buildMessage(messageContent) {
    return {
		contentType: 'PlainText',
		content: messageContent,
    };
}

// Build a responseCard with a title, subtitle, and an optional set of options which should be displayed as buttons.
function buildResponseCard(title, subTitle, options) {
    let buttons = null;
    if (options !== null) {
        buttons = [];
        for (let i = 0; i < Math.min(5, options.length); i++) {
            buttons.push(options[i]);
        }
    }
    return {
        contentType: 'application/vnd.amazonaws.card.generic',
        version: 1,
        genericAttachments: [{
            title,
            subTitle,
            buttons,
        }],
    };
}

function buildResponseOptions(optionsArray = Array){
    var responseOptions = [];
    for(var i=0; i<optionsArray.length; i++){
        var temp = {
            "text": optionsArray[i],
            "value": optionsArray[i]
        }
        responseOptions.push(temp);
    }
    return responseOptions;
}

function keyExists(key, search) {
    if (!search || (search.constructor !== Array && search.constructor !== Object)) {
        return false;
    }
    for (var i = 0; i < search.length; i++) {
        if (search[i] === key) {
            return true;
        }
    }
    return key in search;
}

// --------------- Functions that control the skill's behavior -----------------------

/**
 * Performs dialog management and fulfillment for ordering a beverage.
 * (we only support ordering a mocha for now)
 */
function orderBeverage(intentRequest, callback) {

	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;

	if (source === 'DialogCodeHook') {

		// perform validation on the slot values we have
		const slots = intentRequest.currentIntent.slots;

		const beverageType = (slots.BeverageType ? slots.BeverageType : null);
		const beverageSize = (slots.BeverageSize ? slots.BeverageSize : null);
		const beverageTemp = (slots.BeverageTemp ? slots.BeverageTemp : null);

        
        if(! (beverageType && (keyExists(beverageType, todayMenuBeverageType)))){
            var menuItem = buildResponseOptions(Object.keys(todayMenuBeverageType));
            
            callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'BeverageType', 
			    buildMessage('Sorry, but we can only do a mocha or a chai. What kind of beverage would you like?'), 
			    buildResponseCard("Menu", "Today's Menu", menuItem)));
		}

		// let's assume we only accept short, tall, grande, venti, small, medium, and large for now
		if (!(beverageSize && beverageSize.match(/short|tall|grande|venti|small|medium|large/) && keyExists(beverageSize, todayMenuBeverageType[beverageType].size))) {
		    if(beverageSize){
		        var sizeOfItem = buildResponseOptions(todayMenuBeverageType[beverageType].size);
            
			    callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'BeverageSize',
			        buildMessage('Sorry, but we don\'t have this size; consider a small.  What size?'),
			        buildResponseCard(`${beverageType}`, "available sizes", sizeOfItem)
			    ));
		    }else{
		        callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'BeverageSize'));
		    }
		}

		// let's say we need to know temperature for mochas
		if (!(beverageTemp && beverageTemp.match(/kids|hot|iced/))) {
			callback(elicitSlot(outputSessionAttributes, intentRequest.currentIntent.name, slots, 'BeverageTemp'));
		}

		// if we've come this far, then we simply defer to Lex
		callback(delegate(outputSessionAttributes, slots));
		return;
	}

	callback(close(outputSessionAttributes, 'Fulfilled', {
		contentType: 'PlainText',
		content: `Great!  Your ${intentRequest.currentIntent.slots.BeverageType} will be available for pickup soon.  Thanks for using CoffeeBot!`
	}));
}

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {

	console.log(`dispatch userId=${intentRequest.userId}, intent=${intentRequest.currentIntent.name}`);

	const name = intentRequest.currentIntent.name;

	// dispatch to the intent handlers
	if (name.startsWith('cafeOrderBeverageIntent')) {
		return orderBeverage(intentRequest, callback);
	}
	throw new Error(`Intent with name ${name} not supported`);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {

	console.log(JSON.stringify(event));

	try {
		console.log(`event.bot.name=${event.bot.name}`);

		// fail if this function is for a different bot
		if(! event.bot.name.startsWith('CoffeeBot')) {
		     callback('Invalid Bot Name');
		}
		dispatch(event, (response) => callback(null, response));
	} catch (err) {
		callback(err);
	}
};
