const fs = require('fs');
const path = require('path');

/**
 * This file is a temporary script to replace gpea-npm-en-uploader
 * since we are migrating to mc. It's not fully automated. It still need
 * some manually work.
 *
 * What it does:
 *
 * 1. Replace the MC form with its server side format.
 * 2. Append the server side logic at the frontend of html file.
 * 3. Replace the versiob with timestamps. ex v=123 to v=12325345346
 * 4. Upload the asset to FTP.
 *
 *
 * Usage:
 *
 * at this line to your package.json
 * ```
 * "deploy-mc": "yarn run build:en && node mc-deploy.js"
 * ```
 *
 * and run `yarn deploy-mc` in your terminal.
 *
 *
 * NOTE!!! After the script ends, you HAVE TO MANUALLY copy/past the build/index.html
 * file into your marketing cloud editor.
 */


// definitions
let buildFolder = path.join(__dirname, "build")
	EndpointURL = "https://cloud.greentw.greenpeace.org/websign",
	CampaignId = "7012u000000P2LSAA0",
	DonationPageUrl = "https://www.greenpeace.org/eastasia/", // not used now
	interests = ["Oceans"], // Arctic, Climate, Forest, Health, Oceans, Plastics
	ftpConfigName = "ftp_tw", // refer to ~/.npm-en-uploader-secret
	ftpRemoteDir = "/htdocs/2021/petition/zh-TW.2021.oceans.cwf.signup"

let indexHtmlFilePath = path.join(buildFolder, "index.html")
let fbuf = fs.readFileSync(indexHtmlFilePath)
let content = fbuf.toString()

// patch form contents
let formTmpl =
	`<form method="post" action="%%=v(@EndpointURL)=%%" class="" id="mc-form">
		<input placeholder="FirstName" name="FirstName" type="text" value="">
		<input placeholder="LastName" name="LastName" type="text" value="">
		<input placeholder="Email" name="Email" type="email" value="">
		<input placeholder="MobileCountryCode" name="MobileCountryCode" type="text" value="886">
		<input placeholder="MobilePhone" name="MobilePhone" type="tel" value="">
		<input placeholder="Birthdate" name="Birthdate" type="text" value="">
		<input placeholder="OptIn" name="OptIn" type="checkbox" value="">

		<input type="hidden" name="req" value="post_data">
		<input type="hidden" name="LeadSource" value="%%=v(@LeadSource)=%%">
		<input type="hidden" name="Petition_Interested_In_Arctic__c" value="%%=v(@Petition_Interested_In_Arctic__c)=%%">
		<input type="hidden" name="Petition_Interested_In_Climate__c" value="%%=v(@Petition_Interested_In_Climate__c)=%%">
		<input type="hidden" name="Petition_Interested_In_Forest__c" value="%%=v(@Petition_Interested_In_Forest__c)=%%">
		<input type="hidden" name="Petition_Interested_In_Health__c" value="%%=v(@Petition_Interested_In_Health__c)=%%">
		<input type="hidden" name="Petition_Interested_In_Oceans__c" value="%%=v(@Petition_Interested_In_Oceans__c)=%%">
		<input type="hidden" name="Petition_Interested_In_Plastics__c" value="%%=v(@Petition_Interested_In_Plastics__c)=%%">
		<input type="hidden" name="CampaignId" value="%%=v(@CampaignId)=%%">
		<input type="hidden" name="UtmMedium" value="%%=v(@UtmMedium)=%%">
		<input type="hidden" name="UtmSource" value="%%=v(@UtmSource)=%%">
		<input type="hidden" name="UtmCampaign" value="%%=v(@UtmCampaign)=%%">
		<input type="hidden" name="UtmContent" value="%%=v(@UtmContent)=%%">
		<input type="hidden" name="UtmTerm" value="%%=v(@UtmTerm)=%%">
		<input type="hidden" name="DonationPageUrl" value="%%=v(@DonationPageUrl)=%%">
		<input name="req" type="hidden" value="post_data">

		<input type="hidden" name="numSignupTarget" value="%%=v(@Petition_Signup_Target__c)=%%">
		<input type="hidden" name="numResponses" value="%%=v(@NumberOfResponses)=%%">
	</form>
`


let matches = content.match(/(<form[^<]+mc-form(.|[\r\n])*form>)/)

if (matches) {
	let tokens = content.split(matches[1])

	if (tokens.length==2) {
		header = tokens[0]
		footer = tokens[1]

		content = tokens[0] + formTmpl + tokens[1]
		console.log('Content form patched')
	} else {
		throw new Error("Found multi MC form parts")
	}
} else {
	throw new Error("Cannot resolve the MC form from the index.html file")
}

// append the headers
let headersTmpl =
`%%[
	VAR @UtmMedium, @UtmSource, @UtmCampaign, @UtmContent, @UtmTerm, @LeadSource, @PetitionIssueType, @CampaignId, @DonationPageUrl

	/*Set these params when creating a new petition page, for each core interest of the petition set the value to "true" to update the supporters CRM profile otherwise leave the value blank or with false value */

	SET @EndpointURL = "${EndpointURL}"
	SET @CampaignId = "${CampaignId}"
	SET @LeadSource = "Petition - ${interests.join(",")}"
	SET @Petition_Interested_In_Arctic__c       = "${interests.indexOf("Arctic")>=0 ? "true" : "false"}"
	SET @Petition_Interested_In_Climate__c      = "${interests.indexOf("Climate")>=0 ? "true" : "false"}"
	SET @Petition_Interested_In_Forest__c       = "${interests.indexOf("Forest")>=0 ? "true" : "false"}"
	SET @Petition_Interested_In_Health__c       = "${interests.indexOf("Health")>=0 ? "true" : "false"}"
	SET @Petition_Interested_In_Oceans__c       = "${interests.indexOf("Oceans")>=0 ? "true" : "false"}"
	SET @Petition_Interested_In_Plastics__c     = "${interests.indexOf("Plastics")>=0 ? "true" : "false"}"
	SET @DonationPageUrl = "${DonationPageUrl}"

	/**** Retreive number of responses in campaign used for any petition where petition sign up progress bar is needed to display signups compared to targeted number of signups ****/
	SET @CampaignRows = RetrieveSalesforceObjects("Campaign","NumberOfResponses, Petition_Signup_Target__c","Id","=",@CampaignId)

	IF RowCount(@CampaignRows) > 0 THEN
		SET @CampaignSubscriberRow = Row(@CampaignRows, 1)
		SET @NumberOfResponses = Field(@CampaignSubscriberRow, "NumberOfResponses")
		SET @Petition_Signup_Target__c = Field(@CampaignSubscriberRow, "Petition_Signup_Target__c")
	ENDIF

	/*UTM Tracking Params*/
	SET @UtmMedium          = RequestParameter("utm_medium")
	SET @UtmSource          = RequestParameter("utm_source")
	SET @UtmCampaign        = RequestParameter("utm_campaign")
	SET @UtmContent         = RequestParameter("utm_content")
	SET @UtmTerm            = RequestParameter("utm_term")
]%%
`

content = headersTmpl + "\n" + content
console.log('MC header patched')

// patch version numbers
content = content.replace(/v=\d+/g, "v="+(new Date).getTime())
console.log('version number patched')

// output to the file
fs.writeFileSync(path.join(__dirname, "build", 'index.mc.html'), content)
// fs.writeFileSync("/Users/upchen/Dropbox/WorkingSpace/greenpeace/codes/mc/zhtw.2020.polar.savethearctic-content.html", content)
console.log('content patched')

// upload the folder to FTP
/*
let raw = fs.readFileSync(path.join(os.homedir(), ".npm-en-uploader-secret"));
let secrets = JSON.parse(raw);

let ftpSetting = secrets[ftpConfigName]
ftpSetting["remoteDir"] = ftpRemoteDir
upload_folder(ftpSetting, buildFolder)
*/