// @ts-check
import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';

const wsNode = 'wss://kusama-rpc.polkadot.io';
const startBlock = 11404470;
const endBlock = 11404500;
const chunkSize = 10;

export const harvestBlock = async (api: ApiPromise, blockNumber: number) => {
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const apiAt = await api.at(blockHash);
    const [
      { block },
      blockEvents,
      timestamp,
    ] = await Promise.all([
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
      const metadata = await api.rpc.state.getMetadata(blockHash);
      console.log(`runtime upgrade at block ${blockNumber}, timestamp ${timestamp}!`);
    }
  } catch (error) {
    console.log(error);
  }
};

const reverseRange = (start: number, stop: number, step: number) => Array
  .from({ length: (stop - start) / step + 1 }, (_, i) => stop - (i * step));

export const range = (start: number, stop: number, step: number) => Array
  .from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));

const chunker = (a: any[], n: number): any[] => Array.from(
  { length: Math.ceil(a.length / n) },
  (_, i) => a.slice(i * n, i * n + n),
);

const harvestBlocks = async (api: ApiPromise, startBlock: number, endBlock: number) => {
  const blocks = reverseRange(startBlock, endBlock, 1);
  const chunks = chunker(blocks, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(
        (blockNumber: number) => harvestBlock(api, blockNumber),
      ),
    );
  }
};

const getPolkadotAPI = async (): Promise<ApiPromise> => {
  const provider = new WsProvider(wsNode);
  const api = await ApiPromise.create({ provider });
  await api.isReady;
  return api;
};

const main = async () => {
  const api = await getPolkadotAPI();
  await harvestBlocks(api, startBlock, endBlock);
  return;
}

main().catch(console.error).finally(() => process.exit());
