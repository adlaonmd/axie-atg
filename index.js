import fs from "fs";
import axiosDelimiter from "./axiosDelimiter.js";
import Web3 from "web3";
const web3 = new Web3();
import scholars from "./scholars.js";

let result = [];

//Generate Random Message
async function getRandMessage() {
  const data = {
    operationName: "CreateRandomMessage",
    query: "mutation CreateRandomMessage {\ncreateRandomMessage\n}\n",
    variables: {},
  };

  return axiosDelimiter
    .post("https://axieinfinity.com/graphql-server-v2/graphql", data)
    .then((res) => {
      return res.data.data.createRandomMessage;
    })
    .catch((err) => {
      console.log(err);
    });
}

//Generate Signature Message
function getSignMessage(randMessage, privateKey) {
  let hexSignature = web3.eth.accounts.sign(randMessage, privateKey);
  return hexSignature.signature;
}

//Generate Access Token
async function getAccessToken(accountAddress, randMessage, hexSignature) {
  const data = {
    operationName: "CreateAccessTokenWithSignature",
    variables: {
      input: {
        mainnet: "ronin",
        owner: accountAddress,
        message: randMessage,
        signature: hexSignature,
      },
    },
    query:
      "mutation CreateAccessTokenWithSignature($input: SignatureInput!) {\n  createAccessTokenWithSignature(input: $input) {\n    newAccount\n    result\n    accessToken\n    __typename\n  }\n}\n",
  };

  return axiosDelimiter
    .post("https://axieinfinity.com/graphql-server-v2/graphql", data)
    .then((res) => {
      return res.data.data.createAccessTokenWithSignature.accessToken;
    })
    .catch((err) => {
      console.log(err);
    });
}

//Generate the results
async function getResults() {
  let total = scholars.length;
  let processed = 0;
  const randMessage = await getRandMessage();

  scholars.map(async (scholar) => {
    const hexSignature = getSignMessage(randMessage, scholar.private_key);

    scholar = {
      ...scholar,
      access_token: await getAccessToken(
        scholar.ronin_address,
        randMessage,
        hexSignature
      ),
    };
    result.push(scholar);
    processed++;

    if (processed === total) {
      saveFile();
    }
  });
}

//Saves the file as result.json
function saveFile() {
  let jsonContent = JSON.stringify(result, null, "\t");
  fs.writeFile("result.json", jsonContent, "utf8", (err) => {
    if (err) {
      console.log("An error has occured");
      return console.log(err);
    }
    return console.log("JSON file has been saved - result.json");
  });
}

getResults();
