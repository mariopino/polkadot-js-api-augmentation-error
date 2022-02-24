"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.harvestBlock = void 0;
// @ts-check
require("@polkadot/api-augment/kusama");
const api_1 = require("@polkadot/api");
const wsNode = 'wss://kusama-rpc.polkadot.io';
const startBlock = 11404470;
const endBlock = 11404500;
const chunkSize = 10;
const harvestBlock = (api, blockNumber) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blockHash = yield api.rpc.chain.getBlockHash(blockNumber);
        const apiAt = yield api.at(blockHash);
        const [{ block }, blockEvents, timestamp,] = yield Promise.all([
            api.rpc.chain.getBlock(blockHash),
            apiAt.query.system.events(),
            apiAt.query.timestamp.now(),
        ]);
        console.log(blockNumber);
        // console.log(JSON.stringify(block.toHuman(), null, 2));
        // console.log(JSON.stringify(blockEvents.toHuman(), null, 2));
        const runtimeUpgrade = blockEvents
            .find(({ event }) => api.events.system.CodeUpdated.is(event));
        if (runtimeUpgrade) {
            // problematic query, producing type errors
            const metadata = yield api.rpc.state.getMetadata(blockHash);
            console.log(`runtime upgrade at block ${blockNumber}, timestamp ${timestamp}!`);
        }
    }
    catch (error) {
        console.log(error);
    }
});
exports.harvestBlock = harvestBlock;
const reverseRange = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => stop - (i * step));
const range = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
exports.range = range;
const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const harvestBlocks = (api, startBlock, endBlock) => __awaiter(void 0, void 0, void 0, function* () {
    const blocks = reverseRange(startBlock, endBlock, 1);
    const chunks = chunker(blocks, chunkSize);
    for (const chunk of chunks) {
        yield Promise.all(chunk.map((blockNumber) => (0, exports.harvestBlock)(api, blockNumber)));
    }
});
const getPolkadotAPI = () => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new api_1.WsProvider(wsNode);
    const api = yield api_1.ApiPromise.create({ provider });
    yield api.isReady;
    return api;
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const api = yield getPolkadotAPI();
    yield harvestBlocks(api, startBlock, endBlock);
    return;
});
main().catch(console.error).finally(() => process.exit());
