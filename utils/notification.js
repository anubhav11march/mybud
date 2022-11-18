var admin = require('firebase-admin');
var serviceAccount = require('../firebaseSDKKeys.json');
const { successmessage, errormessage } = require('../utils/util');

// firebase-admin account initalization////
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

module.exports = {
	/**
	 *send notification to user device
	 * @param {Object} req - request object
	 */
	async sendNotification(title, deviceToken, message) {
		return new Promise((resolve, reject) => {
			const registrationTokens = deviceToken;
			//  var registrationToken = 'cs_p8u0vQyqxup3W9tU_A3:APA91bEPbIETaVaOpiPSvF0SYrFZAxIF7w8sHYMbT18CA7EPKy1-9U4ujppoKLz-No3v-0dUgypW6-7eqGAMBadlKEtjMGTvFf0lM6M6FjHOkaz5JIXUlM5EBEE89wuAXyjGEmlsFGtY';

			var payload = {
				notification: {
					title: title,
					body: message,
				},
			};
			var options = {
				priority: 'high',
				timeToLive: 86400,
				content_available: true,
			};
			admin
				.messaging()
				.sendToDevice(registrationTokens, payload, options)
				.then((response) => {
					console.log(
						response.successCount,
						' messages were sent successfully'
					);
					resolve(true);
				})
				.catch(function (error) {
					reject(errormessage(error.errorInfo.message)); //422
					// console.log("error:",error.errorInfo.message);
					// utils.notificationErrObject(error,reject);
				});
		});
	},
};
