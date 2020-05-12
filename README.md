# amazon-ai-building-better-bots
Code samples related to [Building Better Bots](https://aws.amazon.com/blogs/ai/building-better-bots-part-2/) published on the AWS ML Blog

# CoffeeBot

CoffeeBot is a transactional chat bot that can help one order a mocha (relies on AWS Amplify and Android).

Consider this conversation:
> User:  May I have a mocha? <br/>
> CoffeeBot:  What size?  small, medium, large? <br/>
> User:  small <br/>
> CoffeeBot:  Would you like that iced or hot? <br/>
> User:  hot <br/>
> CoffeeBot:  You'd like me to order a small mocha.  Is that right? <br/>
> User:  Make it a large mocha <br/>
> CoffeeBot:  You'd like me to order a large mocha.  Is that right? <br/>
> User:  yeah <br/>
> CoffeeBot:  Great! Your mocha will be available for pickup soon. Thanks for using CoffeeBot!

Let's build this voice bot, an Android App that talks to you using Amazon Polly and Amazon Lex.
You can use the AWS Console for your account to start testing the bot, but you can also build a mobile app using:
- Android development environment ([download](https://developer.android.com/sdk))
- To test voice (you can use the Android Emulator for text)
	- An Android device
	- A USB cable for USB debugging ([more info for Amazon Emulators](https://developer.android.com/studio/run/emulator))
- You can also use the AWS ([Device Farm](https://docs.aws.amazon.com/devicefarm/latest/developerguide/welcome.html)): Device Farm is an app testing service that you can use to test and interact with your Android, iOS, and web apps on real, physical phones and tablets that are hosted by Amazon Web Services (AWS).

For simplicity, we shall stick with the Android Emulator App (If we ever get to this optional part).

First, we'll create the Amazon Lex bot.  Then, we'll add some Lambda Functions to bring it to life.  Finally, we'll put it all together with Amplify and the Lex Android SDK (Optional).

## Amazon Lex bot
#### 1. Create bot
1. From the Amazon Lex console, create a Custom bot with these settings (you can see these in the "Settings" tab later)
    - Bot name:  `CoffeeBot`
		- To work independently in a shared environment, use your initials in the name (e.g., `CoffeeBotXXX`)
    - Output voice:  `Salli`
    - Session timeout:  `5 min`
    - Sentiment Analysis: (accept the default) `No`
    - IAM role:  (accept the default) `AWSServiceRoleForLexBots`
	- COPPA:  (our bot is not directed at children) `No`
	
	
	

#### 2. Create Order Beverage Intent
From the left, add a new Intent called `cafeOrderBeverageIntent` with the following settings and click "Save Intent" to save the Intent.  
To work independently in a shared environment, use your initials in the Intent name (e.g., `cafeOrderBeverageIntentXXX`).

	1.Sample Utterances: add these to the list of sample utterances so the bot recognizes similar phrases (each entry on a 		separate line) Lambda initialization and validation (leave unchecked)
	```
	I would like a {BeverageSize} {BeverageType}
	Can I get a {BeverageType}
	May I have a {BeverageSize} {Creamer} {BeverageType}
	Can I get a {BeverageSize} {BeverageTemp} {Creamer} {BeverageType}
	Let me get a {BeverageSize} {Creamer} {BeverageType}
	```
	
	2. Create Slot types
	From the left, select Slot types and add the following Slot types (each value should be a separate entry); remember to 		"Save slot type" as you go along. To work independently in a shared environment, use your initials in the names 	(e.g., cafeBeverageTypeXXX).
	Note: Although they are saved with the AWS Account, Slot Types will only show up in the list when they are associated 		in the next step.

 


#### 3. Create Slot types
Add the following Slot types (each value should be a separate entry); remember to "Save slot type" as you go along.
To work independently in a shared environment, use your initials in the names (e.g., `cafeBeverageTypeXXX`).  
Note:  Although they are saved with the AWS Account, Slot Types will only show up in the list when they are associated in the next step.

Slot type name | Description | Values (each entry on a separate line)
-------------- | ----------- | --------------------
`cafeBeverageType` | *Slot types are shared at the account level so text would help other developers determine if they can reuse this Slot type.*| `coffee`; `cappuccino`; `latte`; `mocha`; `chai`; `espresso`; `smoothie` <br/><br/> ** each entry on a separate line*
`cafeBeverageSize` | | `kids`; `small`; `medium`; `large`; `extra large`; `six ounce`; `eight ounce`; `twelve ounce`; `sixteen ounce`; `twenty ounce`
`cafeCreamerType` | | `two percent`; `skim milk`; `soy`; `almond`; `whole`; `skim`; `half and half`
`cafeBeverageTemp` | | `kids`; `hot`; `iced`
#### 4. Lambda initialization and validation (leave unchecked)
#### 5. Add Slots to the Intent
Add the following entries to the list of Slots, choosing the Slot Types created above.  Click "Add slot to intent".

Required | Name            | Slot type | Prompt
-------- | --------------- | --------- | -------------
`Yes` | `BeverageType` | `cafeBeverageType` | `What kind of beverage would you like?  For example, mocha, chai, etc.`
`Yes` | `BeverageSize` | `cafeBeverageSize` | `What size?  small, medium, large?`
 &nbsp;| `Creamer` | `cafeCreamerType` | `What kind of milk or creamer?`
 &nbsp;| `BeverageTemp` | `cafeBeverageTemp` | `Would you like that iced or hot?`

**Confirmation prompt:** You'd like me to order a `{BeverageSize}` `{BeverageType}`. Is that right? to confirm. "Okay. Nothing to order this time. See you next time!" to cancel <br />
Fulfillment: choose "Return parameters to client" for now <br />
Response: Select Add Message to add a message(s) to close the intent: Thank you. Your `{BeverageType}` has been ordered.
Check the box for Wait for user reply type: OK. Thank you. Have a great day! <br />

**Review the Error handling settings**
Clarification prompts: (one prompt) Sorry, but I didn't understand that. Would you try again, please?
Maximum number of retries: 2
Hang-up phrase: (one phrase) Sorry, I could not understand. Goodbye.

#### 6. Build and Test the Bot
Build the app by clicking the build button at the top right. To test the bot with some of the utterances, expand the Test Chatbot dialog at the top right corner of the Amazon Lex Console. For example, if you say May I have a chai? does Lex correctly map chai to the BeverageType slot?
  For example, if you say `May I have a chai?`, does Lex correctly map `chai` to the `BeverageType` slot?

## Lambda Function
1. Go to "Services" at the top of the screen, and search for the AWS Lambda service (it's helpful to open the AWS Lambda console in another tab). Create the `cafeOrderCoffee` function by saving `cafeOrderCoffee_lambda.js` as a Node.js 12.x function
	- To work independently in a shared environment, use your initials in the function name (e.g., `cafeOrderCoffeeXXX`)
    - You can get the function source [here](https://github.com/aws-samples/amazon-ai-building-better-bots/blob/master/src/index.js)
    - (No need to set up a trigger; you can accept default values for most of the configuration)
    - Choose an IAM role that includes the `AWSLambdaBasicExecutionRole` Managed Policy.  If no such role exists, you can create a new IAM Role using one of these approaches:
        - Choose "Create new role from template(s)", provide a role name, and choose `Simple Microservice permissions` from the "Policy templates" dropdown
        - Choose "Create a Custom role", which should open up a new tab where an IAM role is shown; review the policy document and click "Allow"
2. Configure the Test event and test to confirm the function works as expected (see `cafeOrderCoffee_test.json`)
    - you can get the event source [here](https://github.com/aws-samples/amazon-ai-building-better-bots/blob/master/test/cafeOrderCoffee_test.json)
3. You'll notice that the function checks the bot name it receives (``if (event.bot.name !== 'CoffeeBot')``); remember to change this value in the function and in the test event to match the name you used for your bot

## Test the bot
a. From the Lex Console, select the `CoffeeBot` bot and choose `Latest` from the version drop down to make changes
b. Modify the `cafeOrderBeverageIntent` Intent
	- Associate it with the new `cafeOrderCoffee` Lambda function (select "Lambda function" in the "Lambda initialization and validation" area)
		-  When prompted, allow Amazon Lex to call your new function
	- Associate it with the new `cafeOrderCoffee` Lambda function for (select "Lambda function" in the "Fulfillment" area); remember to click "Save Intent"
c. Build the bot
d. Test using the Amazon Lex Console; do you see any responses when you ask `May I have a mocha?`

## Android App (Optional)
Create a Mobile Application using Amplify. AWS Amplify is a development platform for building secure, scalable mobile and web applications. It makes it easy for you to authenticate users, securely store data and user metadata, authorize selective access to data, integrate machine learning, analyze application metrics, and execute server-side code. Sign into the AWS Amplify console to get started.

## AWS Amplify
When you're ready, try out [AWS Amplify](https://aws-amplify.github.io/docs/js/interactions) for bringing your chatbot to a mobile or web environment.

## Errors
If you have this error: "The checksum value doesn't match for the resource named..." then a page refresh is required - the build should work as normal after this.
