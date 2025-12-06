const twillo = require("twilio");

//Twillo credentials form env
const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid = process.env.TWILLO_SERVICE_SID;

const client = twillo(accountSid, authToken);

// send otp to phone number
const sendOtpToPhoneNumber = async (phoneNumber) => {
    try {
        console.log("Sending otp to this number", phoneNumber);
        if (!phoneNumber) {
            throw new Error("phone number is required");
        }
        const response = await client.verify.v2.services(serviceSid).verifications.create({
            to: phoneNumber,
            channel: "sms",
        });
        console.log("This is my otp response ", response);
        return response;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to send otp");
    }
};

const verifyOtp = async (phoneNumber, otp) => {
    try {
        console.log("This is my otp ", otp);
        console.log("This is phone number", phoneNumber);
        const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to: phoneNumber,
            code: otp,
        });
        console.log("This is my otp response ", response);
        return response;
    } catch (error) {
        console.error(error);
        throw new Error("Otp verification failed");
    }
};

module.exports = {
    sendOtpToPhoneNumber,
    verifyOtp,
};
