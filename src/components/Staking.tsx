import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { FC } from 'react';
import { notify } from "../utils/notifications";
import { Program, AnchorProvider, setProvider, BN, Idl } from '@coral-xyz/anchor';
import idl from "./reward_pool_main.json";
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string) as Idl;
const programID = new PublicKey(idl.metadata.address);

const getProvider = (connection: any, wallet: any) => {
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    setProvider(provider);
    return provider;
};

export const Staking: FC = () => {
    const { publicKey: walletPublicKey, wallet } = useWallet();
    const { connection } = useConnection();

    const createStake = async () => {
        try {
            const provider = getProvider(connection, wallet);
            const program = new Program(idl_object, programID, provider);

            if (!walletPublicKey) {
                throw new Error('Wallet not connected');
            }

            const user = walletPublicKey;

            // Generating the PDA for reward_pool
            const [rewardPoolPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("reward_pool"), user.toBuffer()],
                program.programId
            );

            // Create a new mint account for the pool token
            const poolTokenMint = new PublicKey('YourPoolTokenMintAddressHere'); // Replace with actual pool token mint address

            // Deriving the pool token vault address
            const poolTokenVault = await splToken.getAssociatedTokenAddress(
                poolTokenMint,
                rewardPoolPDA,
                true,
                splToken.TOKEN_PROGRAM_ID,
                splToken.ASSOCIATED_TOKEN_PROGRAM_ID
            );

            await program.methods.initialize().accounts({
                rewardPool: rewardPoolPDA,
                poolTokenMint: poolTokenMint,
                poolTokenVault: poolTokenVault,
                user: user,
                associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            }).rpc();

            console.log("Stake created successfully");

        } catch (error) {
            console.error("Error while creating staking:", error);
        }
    };

    const depositReward = async (tokenAddress: PublicKey, campaignAmount: number, feeAmount: number, campaignId: number) => {
        try {
            const provider = getProvider(connection, wallet);
            const program = new Program(idl_object, programID, provider);

            if (!walletPublicKey) {
                throw new Error('Wallet not connected');
            }

            const user = walletPublicKey;

            // Generating the PDA for reward_pool
            const [rewardPoolPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("reward_pool"), user.toBuffer()],
                program.programId
            );

            // Deriving the reward_info PDA
            const [rewardInfoPDA] = await PublicKey.findProgramAddress(
                [Buffer.from("reward_info"), user.toBuffer(), new BN(campaignId).toArrayLike(Buffer, 'le', 8)],
                program.programId
            );

            // Create a new mint account for the pool token (replace with actual pool token mint address)
            const poolTokenMint = new PublicKey('YourPoolTokenMintAddressHere');

            // Deriving the pool token vault address
            const poolTokenVault = await splToken.getAssociatedTokenAddress(
                poolTokenMint,
                rewardPoolPDA,
                true,
                splToken.TOKEN_PROGRAM_ID,
                splToken.ASSOCIATED_TOKEN_PROGRAM_ID
            );

            // User's token account
            const depositerTokenAccount = await splToken.getAssociatedTokenAddress(
                poolTokenMint,
                user,
                false,
                splToken.TOKEN_PROGRAM_ID,
                splToken.ASSOCIATED_TOKEN_PROGRAM_ID
            );

            await program.methods.depositReward(tokenAddress, new BN(campaignAmount), new BN(feeAmount), new BN(campaignId)).accounts({
                poolTokenMint: poolTokenMint,
                rewardPool: rewardPoolPDA,
                depositerTokenAccount: depositerTokenAccount,
                campaignTokenAccount: poolTokenVault,
                rewardInfo: rewardInfoPDA,
                depositer: user,
                associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            }).rpc();

            console.log("Reward deposited successfully");

        } catch (error) {
            console.error("Error while depositing reward:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen to-fuchsia-500">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="group w-60 m-4 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black font-semibold py-2 px-4 rounded shadow-lg transform transition-transform duration-300 hover:scale-105"
                    onClick={createStake} disabled={!walletPublicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden"> 
                        Create Stake 
                    </span>
                </button>
                <button
                    className="group w-60 m-4 btn animate-pulse bg-gradient-to-br from-green-500 to-blue-500 hover:from-white hover:to-blue-300 text-black font-semibold py-2 px-4 rounded shadow-lg transform transition-transform duration-300 hover:scale-105"
                    onClick={() => depositReward(new PublicKey('YourTokenAddressHere'), 100, 0, 1)} disabled={!walletPublicKey}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden"> 
                        Deposit Reward 
                    </span>
                </button>
            </div>
        </div>
    );
    
};
