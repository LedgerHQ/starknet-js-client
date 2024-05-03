const SpeculosTransport = require("@ledgerhq/hw-transport-node-speculos").default;
const { StarknetClient } = require("../");

const apduPort = 9999;

async function main() {

    const transport = await SpeculosTransport.open({ apduPort });

	const stark = new StarknetClient(transport);

	const version = await stark.getAppVersion();

	console.log(version);

	const signature = await stark.signHash("m/2645'/1195502025'/1148870696'/0'/0'/0", "55b8f28706a5008d3103bcb2bfa6356e56b95c34fed265c955846670a6bb4ef");

	console.log(signature);

	transport.close();
}

main();
