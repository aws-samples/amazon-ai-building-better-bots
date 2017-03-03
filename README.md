# amz-ai-building-better-bots
Code samples related to [Building Better Bots](https://aws.amazon.com/blogs/ai/building-better-bots-part-2/) published on the AI Blog

# CoffeeBot

CoffeeBot is a transactional chat bot that can help one order a mocha (relies on AWS Mobile Hub and Android).

Consider this conversation:
> User:  May I have a mocha?

> CoffeeBot:  What size?  small, medium, large?

> User:  small

> CoffeeBot:  Would you like that iced or hot?

> User:  hot

> CoffeeBot:  You'd like me to order a small mocha.  Is that right?

> User:  Make it a large mocha

> CoffeeBot:  You'd like me to order a large mocha.  Is that right?

> User:  yeah

> CoffeeBot:  Great! Your mocha will be available for pickup soon. Thanks for using CoffeeBot!

Let's build this voice bot, an Android App that talks to you using Amazon Polly and Amazon Lex.
You'll need the following in addition to your AWS account:
- Android development environment ([download](https://developer.android.com/sdk))
- To test voice (you can use the simulator for text)
	- An Android device
	- A USB cable for USB debugging ([more info for Amazon Fire tablets](https://developer.amazon.com/public/solutions/devices/fire-tablets/app-development/setting-up-your-development-environment-for-fire-tablets))


First, we'll create the Lex bot.  Then, we'll add some Lambda Functions to bring it to life.  Finally, we'll put it all together with Mobile Hub and the Lex Android SDK.

## Prerequisites
Create two IAM roles as described below.  For more information, you can use the instructions provided in the Lex [documentation](http://docs.aws.amazon.com/lex/latest/dg/gs-bp-prep.html).

1.`CoffeeBot_app_role` - a Service role so Lex can invoke Lambda on your behalf with this custom inline policy (it's easy to start with Lambda and then swap it out with Lex as shown below)
```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Action": [
				"lambda:InvokeFunction",
				"polly:SynthesizeSpeech"
			],
			"Effect": "Allow",
			"Resource": "*"
		}
	]
}
```
This role also needs to trust the Amazon Lex service principal (`lex.amazonaws.com`).
```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Principal": {
				"Service": "lex.amazonaws.com"
			},
			"Action": "sts:AssumeRole"
		}
	]
}
```
2.`CoffeeBot_lambda_role` - a Lambda Service role so the Lambda fulfillment function can assume the role and write logs (start with this custom inline policy)
```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"logs:CreateLogGroup",
				"logs:CreateLogStream",
				"logs:PutLogEvents"
			],
			"Resource": [
				"*"
			]
		}
	]
}
```

## Lex bot
#### 1. Create bot
1. From the Amazon Lex console, create a Custom bot with these settings (you can see these in the "Settings" tab later)
  - Bot name:  `CoffeeBot`
  - Output voice:  `Salli`
  - Session timeout:  `10 min`
  - IAM role:  `CoffeeBot_app_role`
1. Review the Error handling settings
  - Prompts:  (one prompt)  `Sorry, can you please repeat that?`
  - Maximum number of retries:  `5`
  - Hang-up phrase:  (one phrase) `Sorry, I could not understand.  Goodbye.`

#### 2. Create Slot types
1. Add the following Slot types so they show up on the left (remember to Save as you go along).

Slot type name | Description | Values
-------------- | ----------- | --------------------
`cafeBeverageType` | *Slots are shared at the account level so text would help other developers determine if they can reuse this Slot.*| `coffee`; `cappuccino`; `latte`; `mocha`; `chai`; `espresso`; `smoothie`
`cafeBeverageSize` | | `kids`; `small`; `medium`; `large`; `extra large`; `six ounce`; `eight ounce`; `twelve ounce`; `sixteen ounce`; `twenty ounce`
`cafeCreamerType` | | `two percent`; `skim milk`; `soy`; `almond`; `whole`; `skim`; `half and half`
`cafeBeverageTemp` | | `kids`; `hot`; `iced`
`cafeBeverageStrength` | | `single`; `double`; `triple`; `quad`; `quadruple`
`cafeBeverageExtras` | | `half sweet`; `semi sweet`

#### 3. Create Order Beverage Intent
From the left, add a new Intent called `cafeOrderBeverageIntent` with the following settings and click "Save" to save the Intent
1. Options (leave options unchecked)
2. Fulfillment:  choose "Return parameters to client" for now
3. Confirmation prompt:  `You'd like me to order a {BeverageSize} {BeverageType}.  Is that right?` to confirm and `Okay.  Nothing to order this time.  See you next time!` to cancel.
4. Sample Utterances
```
I would like a {BeverageSize} {BeverageType}
Can I get a {BeverageType}
May I have a {BeverageSize} {Creamer} {BeverageStrength} {BeverageType}
Can I get a {BeverageSize} {BeverageTemp} {Creamer} {BeverageStrength} {BeverageType}
Let me get a {BeverageSize} {Creamer} {BeverageType}
```
5. Slots

Required | Name            | Slot type | Prompt
-------- | --------------- | --------- | -------------
`Yes` | `BeverageType` | `cafeBeverageType` | `What kind of beverage would you like?  For example, mocha, chai, etc.`
`Yes` | `BeverageSize` | `cafeBeverageSize` | `What size?  small, medium, large?`
 | `Creamer` | `cafeCreamerType` | `What kind of milk or creamer?`
 | `BeverageTemp` | `cafeBeverageTemp` | `Would you like that iced or hot?`
 | `BeverageStrength` | `cafeBeverageStrength` | `Single or double?`
 | `BeverageExtras` | `cafeBeverageExtras` | `extras?`

#### 4. Test
Build the app and test some of the Utterances in the Test Bot dialog at the bottom right of the Lex Console.  For example, if you say `May I have a chai?`, does Lex correctly map `chai` to the `BeverageType` slot?

## Lambda Functions
1. Create the `cafeOrderCoffee` function by saving `cafeOrderCoffee_lambda.js` as a Node.js 4.3 function
  - (No need to set up a trigger; you can accept default values for most of the configuration)
  - Choose `CoffeeBot_lambda_role` as the IAM role
  - Test (see `cafeOrderCoffee_test.json`)

## Test the bot
1. From the Lex Console, select the `CoffeeBot` bot and choose `Latest` from the version drop down to make changes
1. Modify the `cafeOrderBeverageIntent` Intent to associate it with the new `cafeOrderCoffee` Lambda function; remember to click "Save"
  -  The Lambda function overrides the "Goodbye message" (so we don't configure it here)
1. Build the app
1. Test using Lex Console; do you see any responses when you ask `May I have a mocha?`

## Android App
1. From the Mobile Hub console, create a new project called `CoffeeBot`.
1. Add the "Conversational Bots" feature to the project.  When prompted, import `CoffeeBot`.  Mobile Hub takes care of a number of important details behind the scenes.  A new Amazon Cognito Federated Identity Pool is created for this new app along with roles so that the users can interact with Lex (using voice and text).
1. Source code for the new app is immediately available for download.
1. Follow the instructions in the `READ_ME/index.html` file to setup, compile, and run the app.
