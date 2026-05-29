import type { Address } from "viem";
import type { Config } from "wagmi";

/** Set the active wagmi account without reconnecting or prompting the wallet. */
export function switchWalletAccount(
  config: Config,
  target: Address,
  permitted: readonly Address[],
): void {
  const uid = config.state.current;
  if (!uid) return;

  const connection = config.state.connections.get(uid);
  if (!connection) return;

  const normalizedTarget = target.toLowerCase();
  const active = connection.accounts[0];
  if (active?.toLowerCase() === normalizedTarget) return;

  if (!permitted.some((account) => account.toLowerCase() === normalizedTarget)) {
    return;
  }

  const reordered: [Address, ...Address[]] = [
    target,
    ...permitted.filter((account) => account.toLowerCase() !== normalizedTarget),
  ];

  config.setState((state) => {
    const currentConnection = state.connections.get(uid);
    if (!currentConnection) return state;

    return {
      ...state,
      connections: new Map(state.connections).set(uid, {
        ...currentConnection,
        accounts: reordered,
      }),
    };
  });
}
